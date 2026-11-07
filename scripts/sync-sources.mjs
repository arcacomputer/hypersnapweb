import { mkdir, writeFile, readFile, rename, unlink } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import process from "node:process";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { toString as mdastToString } from "mdast-util-to-string";
import GithubSlugger from "github-slugger";
import { visit } from "unist-util-visit";

const ORG = "farcasterorg";
const API_BASE = "https://api.github.com";
const OUT_FILE = path.join(process.cwd(), "src/data/farcasterorg-sources.json");
const SOURCE_REPO_ORDER = ["hypersnap", "hypersnap-docs-web", "snap", "protocol", "client-snapshot", "miniapps"];

const DOCS_LINK_LIMIT = 80;
const README_HEADING_LIMIT = 10;

// Fail closed: a partial refresh never replaces the accepted snapshot.
export function createGithubClient({ token = "", fetchImpl = (...args) => fetch(...args), requestTimeoutMs = 15_000, budgetMs = 180_000, maxRequests = 300, maxResponseBytes = 8 * 1024 * 1024, maxTotalBytes = 32 * 1024 * 1024 } = {}) {
  const deadline = Date.now() + budgetMs;
  let requests = 0;
  let totalBytes = 0;
  async function request(url, { optional = false, emptyRepo = false, text = false } = {}) {
    const parsed = new URL(url);
    if (parsed.origin !== API_BASE || parsed.username || parsed.password) throw new Error("Unexpected GitHub request origin");
    if (++requests > maxRequests || Date.now() >= deadline) throw new Error("Source collection budget exceeded");
    const response = await fetchImpl(url, {
      redirect: "error",
      signal: AbortSignal.timeout(Math.min(requestTimeoutMs, deadline - Date.now())),
      headers: {
        Accept: text ? "application/vnd.github.raw" : "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if ((response.status === 404 && optional) || (response.status === 409 && emptyRepo)) {
      await response.body?.cancel();
      return text ? "" : null;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`GitHub request failed: HTTP ${response.status} ${parsed.pathname}`);
    }
    const byteLimit = text ? Math.min(maxResponseBytes, 2 * 1024 * 1024) : maxResponseBytes;
    if (Number(response.headers.get("content-length")) > byteLimit) {
      await response.body?.cancel();
      throw new Error("GitHub response exceeds byte budget");
    }
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        totalBytes += value.byteLength;
        if (size > byteLimit || totalBytes > maxTotalBytes || Date.now() >= deadline) throw new Error("GitHub response exceeds collection budget");
        chunks.push(value);
      }
    } catch (error) {
      await reader.cancel();
      throw error;
    } finally {
      reader.releaseLock();
    }
    const body = Buffer.concat(chunks).toString("utf8");
    return text ? body : JSON.parse(body);
  }
  return {
    json: (url, options) => request(url, options),
    text: (url, options) => request(url, { ...options, text: true }),
    get requests() { return requests; },
    get bytes() { return totalBytes; },
  };
}

export async function listPublicRepos(client, expectedCount) {
  const repos = [];
  const seen = new Set();
  for (let page = 1; page <= 10; page++) {
    const batch = await client.json(`${API_BASE}/orgs/${ORG}/repos?type=public&per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error("Invalid repository listing");
    for (const repo of batch) {
      if (!repo.name || repo.private || seen.has(repo.name)) throw new Error("Invalid or duplicate public repository");
      seen.add(repo.name);
      repos.push(repo);
    }
    if (batch.length < 100) {
      if (repos.length !== expectedCount) throw new Error(`Public repository count changed or incomplete: ${repos.length}/${expectedCount}`);
      return repos;
    }
  }
  throw new Error("Repository pagination budget exceeded");
}

export async function atomicWriteSnapshot(file, snapshot) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: "wx" });
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch((error) => { if (error.code !== "ENOENT") throw error; });
  }
}

function sortRepos(repos) {
  const rank = new Map(SOURCE_REPO_ORDER.map((name, index) => [name, index]));
  return [...repos].sort((a, b) => {
    const aRank = rank.get(a.name) ?? 100;
    const bRank = rank.get(b.name) ?? 100;
    return aRank - bRank || a.name.localeCompare(b.name);
  });
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function summarizeMarkdown(markdown, fallback = "") {
  const lines = markdown
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#") && !line.trim().startsWith("|"));

  const text = stripMarkdown(lines.slice(0, 16).join(" "));
  const summary = text || fallback || "No README summary is available yet.";

  return summary.length > 420 ? `${summary.slice(0, 417).trim()}...` : summary;
}

function extractHeadings(markdown) {
  return markdown
    .split("\n")
    .map((line) => line.match(/^(#{1,3})\s+(.+)$/)?.[2]?.trim())
    .filter(Boolean)
    .slice(0, README_HEADING_LIMIT);
}

function extractPublicNode(texts) {
  const match = texts.join("\n").match(/https:\/\/haatz\.quilibrium\.com/g);
  return match?.[0] ?? "https://haatz.quilibrium.com";
}

function extractRequirementBullets(readme) {
  const match = readme.match(/system requirements[\s\S]*?(?=\n\n)/i);
  if (!match) {
    return [
      "16 GB RAM",
      "4 CPU cores or vCPUs",
      "1.5 TB free storage",
      "Public IP address",
      "Allow peer gossip on 3382/udp; keep HTTP 3381/tcp and gRPC 3383/tcp private or authenticated",
    ];
  }

  return match[0]
    .split("\n")
    .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean)
    .map((line) => /ports?.*338[123]/i.test(line) ? "Allow peer gossip on 3382/udp; keep HTTP 3381/tcp and gRPC 3383/tcp private or authenticated" : line);
}

function extractHyperGoals(hyperDoc) {
  const goalsSection = hyperDoc.match(/## Goals\s+([\s\S]*?)(?=\n## )/);
  return (goalsSection?.[1] ?? "")
    .split("\n")
    .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

function stripDocsRoot(sourcePath) {
  return sourcePath
    .replace(/^src\//, "")
    .replace(/^docs\//, "")
    .replace(/^site\/docs\/pages\//, "");
}

function computeDocSlug(sourcePath) {
  const stripped = stripDocsRoot(sourcePath)
    .replace(/\.(md|mdx)$/, "")
    .replace(/\/index$/, "");
  return stripped || "introduction";
}

function computeDocDir(sourcePath) {
  const stripped = stripDocsRoot(sourcePath);
  const lastSlash = stripped.lastIndexOf("/");
  return lastSlash === -1 ? "" : stripped.substring(0, lastSlash);
}

function resolveInternalSlug(currentDir, target) {
  // Drop trailing anchors during path resolution
  const [pathPart, hash] = target.split("#");
  let pathSegment = pathPart.replace(/\.(md|mdx)$/, "");

  // If absolute (starts with /), treat as already resolved
  if (pathSegment.startsWith("/")) {
    pathSegment = pathSegment.replace(/^\/+/, "");
  } else {
    // Resolve relative to the current doc's source directory
    const cleaned = pathSegment.replace(/^\.\//, "");
    pathSegment = currentDir ? `${currentDir}/${cleaned}` : cleaned;
  }

  const parts = pathSegment.split("/");
  const stack = [];
  for (const part of parts) {
    if (part === "..") stack.pop();
    else if (part && part !== ".") stack.push(part);
  }
  let resolved = stack.join("/").replace(/\/index$/, "");
  if (!resolved) resolved = currentDir;
  return hash ? `${resolved}#${hash}` : resolved;
}

function remarkRewriteInternalLinks(currentDir) {
  return (tree) => {
    visit(tree, "link", (node) => {
      const url = node.url;
      if (!url) return;
      if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("//") ||
        url.startsWith("mailto:") ||
        url.startsWith("tel:")
      ) {
        return;
      }
      if (url.startsWith("#")) return; // anchor on same page

      const resolved = resolveInternalSlug(currentDir, url);
      node.url = `/docs/${resolved}`;
    });
  };
}

function captureTocPlugin(toc) {
  return () => (tree) => {
    const slugger = new GithubSlugger();
    visit(tree, "heading", (node) => {
      if (node.depth < 2 || node.depth > 3) return;
      const text = mdastToString(node).trim();
      if (!text) return;
      const id = slugger.slug(text);
      toc.push({ depth: node.depth, text, id });
    });
  };
}

async function renderMarkdownToHtml(markdown, currentDir) {
  const toc = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(() => remarkRewriteInternalLinks(currentDir))
    .use(captureTocPlugin(toc))
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: {
        className: ["heading-anchor"],
        ariaLabel: "Anchor link to this heading",
      },
      content: {
        type: "text",
        value: " #",
      },
    })
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return { html: String(file), toc };
}

async function enrichDocsLinks(docsLinks, repoName, branch, client) {
  const enriched = [];
  for (const link of docsLinks) {
    const slug = computeDocSlug(link.sourcePath);
    const dir = computeDocDir(link.sourcePath);
    const markdown = await client.text(
      `${API_BASE}/repos/${ORG}/${repoName}/contents/${link.sourcePath}?ref=${encodeURIComponent(branch)}`,
    );

    if (!markdown.trim()) throw new Error(`Empty documentation: ${link.sourcePath}`);

    const { html: contentHtml, toc } = await renderMarkdownToHtml(markdown, dir);

    enriched.push({
      ...link,
      slug,
      contentHtml,
      contentMarkdown: markdown,
      toc,
    });
  }
  return enriched;
}

function extractDocsLinksFromSummary(summary, repoName, branch) {
  const links = [];
  let section = "Docs";

  for (const line of summary.split("\n")) {
    const heading = line.match(/^#+\s+(.+)$/);
    if (heading) {
      section = heading[1].trim();
      continue;
    }

    const link = line.match(/-\s+\[([^\]]+)]\(([^)]+)\)/);
    if (!link) {
      continue;
    }

    const [, title, relativePath] = link;
    if (relativePath.startsWith("http")) {
      continue;
    }

    const cleanPath = relativePath.replace(/^\.\//, "src/");
    links.push({
      title,
      section,
      sourcePath: cleanPath,
      githubUrl: `https://github.com/${ORG}/${repoName}/blob/${branch}/${cleanPath}`,
    });
  }

  if (links.length > DOCS_LINK_LIMIT) throw new Error("Documentation index exceeds collection budget");
  return links;
}

function docsLinksFromTree(tree, repoName, branch) {
  return tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path)
    .filter((itemPath) => {
      const isDoc = itemPath.startsWith("docs/") || itemPath.startsWith("site/docs/pages/");
      const isMarkdown = itemPath.endsWith(".md") || itemPath.endsWith(".mdx");
      return isDoc && isMarkdown;
    })
    .sort()
    .slice(0, DOCS_LINK_LIMIT)
    .map((sourcePath) => ({
      title: sourcePath
        .split("/")
        .at(-1)
        .replace(/\.(md|mdx)$/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      section: sourcePath.startsWith("docs/") ? "Architecture" : "Protocol docs",
      sourcePath,
      githubUrl: `https://github.com/${ORG}/${repoName}/blob/${branch}/${sourcePath}`,
    }));
}

export async function getRepoTree(repoName, branch, client) {
  if (!branch) {
    return [];
  }

  const tree = await client.json(
    `${API_BASE}/repos/${ORG}/${repoName}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
  if (tree.truncated || !Array.isArray(tree.tree)) throw new Error(`Incomplete source tree: ${repoName}`);
  return tree.tree;
}

async function getLatestRelease(repoName, client) {
  const release = await client.json(`${API_BASE}/repos/${ORG}/${repoName}/releases/latest`, {
    optional: true,
  });

  if (!release) {
    return null;
  }

  return {
    tagName: release.tag_name,
    name: release.name || release.tag_name,
    url: release.html_url,
    publishedAt: release.published_at,
  };
}

export async function buildRepoSnapshot(repo, client) {
  const defaultBranch = repo.default_branch || "";
  const commit = defaultBranch ? await client.json(`${API_BASE}/repos/${ORG}/${repo.name}/commits/${encodeURIComponent(defaultBranch)}`, { emptyRepo: true }) : null;
  const sourceCommit = commit?.sha;
  if (commit && !/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error(`Invalid source commit: ${repo.name}`);
  const readme = sourceCommit
    ? await client.text(`${API_BASE}/repos/${ORG}/${repo.name}/readme?ref=${sourceCommit}`, { optional: true })
    : "";
  const tree = await getRepoTree(repo.name, sourceCommit, client);
  const latestRelease = await getLatestRelease(repo.name, client);

  let docsLinks = docsLinksFromTree(tree, repo.name, sourceCommit);
  let publicNodeReferences = [];
  let architectureNotes = [];
  let nodeRequirements = [];

  if (repo.name === "hypersnap") {
    const hyperDoc = tree.some((item) => item.path === "docs/hyper.md") ? await client.text(
      `${API_BASE}/repos/${ORG}/${repo.name}/contents/docs/hyper.md?ref=${sourceCommit}`,
    ) : "";
    architectureNotes = extractHyperGoals(hyperDoc);
    nodeRequirements = extractRequirementBullets(readme);
  }

  if (repo.name === "hypersnap-docs-web") {
    const summary = await client.text(
      `${API_BASE}/repos/${ORG}/${repo.name}/contents/src/SUMMARY.md?ref=${sourceCommit}`,
    );
    const intro = await client.text(
      `${API_BASE}/repos/${ORG}/${repo.name}/contents/src/introduction.md?ref=${sourceCommit}`,
    );
    const gettingStarted = await client.text(
      `${API_BASE}/repos/${ORG}/${repo.name}/contents/src/getting-started.md?ref=${sourceCommit}`,
    );
    docsLinks = extractDocsLinksFromSummary(summary, repo.name, sourceCommit);
    if (!docsLinks.length) throw new Error("Empty documentation index");
    docsLinks = await enrichDocsLinks(docsLinks, repo.name, sourceCommit, client);
    publicNodeReferences = [extractPublicNode([readme, intro, gettingStarted])];
  } else {
    docsLinks = docsLinks.map((link) => ({
      ...link,
      slug: computeDocSlug(link.sourcePath),
    }));
  }

  return {
    name: repo.name,
    description: repo.description || "",
    url: repo.html_url,
    defaultBranch,
    ...(sourceCommit ? { sourceCommit } : {}),
    isEmpty: !sourceCommit,
    primaryLanguage: repo.language || null,
    license: repo.license?.spdx_id || null,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at,
    latestRelease,
    readmeSummary: summarizeMarkdown(readme, repo.description || ""),
    readmeHeadings: extractHeadings(readme),
    docsLinks,
    sourceFacts: {
      publicNodeReferences,
      architectureNotes,
      nodeRequirements,
    },
  };
}

export function validateSnapshot(snapshot, previous) {
  if (!snapshot.repos.length || snapshot.repos.length !== snapshot.organization.publicRepoCount) throw new Error("Incomplete public repository snapshot");
  const currentDocs = snapshot.repos.find((repo) => repo.name === "hypersnap-docs-web")?.docsLinks ?? [];
  const slugs = new Set();
  for (const doc of currentDocs) {
    if (!doc.slug || slugs.has(doc.slug) || !doc.contentHtml?.trim() || !doc.contentMarkdown?.trim()) throw new Error("Missing or duplicate rendered documentation");
    slugs.add(doc.slug);
  }
  for (const doc of previous?.repos?.find((repo) => repo.name === "hypersnap-docs-web")?.docsLinks ?? []) {
    if (doc.contentHtml && !slugs.has(doc.slug)) throw new Error(`Previously rendered doc missing: ${doc.slug}; review removal before accepting`);
  }
}

export function resolveGithubToken({ environment = process.env, execute = execFileSync } = {}) {
  // CI supplies a repository-scoped token; no stored gh account exists there.
  const supplied = environment.GH_TOKEN?.trim() || environment.GITHUB_TOKEN?.trim();
  if (supplied) return supplied;
  if (environment.CI) throw new Error("Source sync requires GH_TOKEN or GITHUB_TOKEN in CI");
  // Local fallback selects the approved account without switching shared auth.
  try {
    const token = execute("gh", ["auth", "token", "--user", "arcabotai"], { encoding: "utf8", timeout: 10_000, stdio: ["ignore", "pipe", "pipe"] }).trim();
    if (token) return token;
  } catch { /* Never include credential command output in an error. */ }
  throw new Error("The local arcabotai GitHub credential is unavailable");
}

async function main() {
  const startedAt = Date.now();
  const token = resolveGithubToken();
  const client = createGithubClient({ token });
  const previous = JSON.parse(await readFile(OUT_FILE, "utf8"));
  const org = await client.json(`${API_BASE}/orgs/${ORG}`);
  const repos = await listPublicRepos(client, org.public_repos);
  const sortedRepos = sortRepos(repos);
  const repoSnapshots = [];

  for (const repo of sortedRepos) {
    repoSnapshots.push(await buildRepoSnapshot(repo, client));
  }

  const sourceUpdatedAt = repoSnapshots
    .map((repo) => repo.pushedAt || repo.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  const hypersnapRepo = repoSnapshots.find((repo) => repo.name === "hypersnap");
  const docsRepo = repoSnapshots.find((repo) => repo.name === "hypersnap-docs-web");

  const snapshot = {
    schemaVersion: 1,
    organization: {
      login: org.login,
      name: org.name || org.login,
      url: org.html_url,
      avatarUrl: org.avatar_url,
      publicRepoCount: org.public_repos,
      createdAt: org.created_at,
    },
    sourceUpdatedAt,
    collectedAt: new Date().toISOString(),
    publicNode: {
      baseUrl: docsRepo?.sourceFacts.publicNodeReferences[0] || "https://haatz.quilibrium.com",
      infoEndpoint: "/v1/info",
      apiPrefix: "/v2/farcaster",
    },
    node: {
      bootstrapCommand:
        "curl -sSL https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh | bash",
      nightlyCommand:
        "curl -sSL https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh | bash -s nightly",
      commands: [
        { label: "Upgrade", command: "cd ~/hypersnap && ./hypersnap.sh upgrade" },
        { label: "Logs", command: "cd ~/hypersnap && ./hypersnap.sh logs" },
        { label: "Stop", command: "cd ~/hypersnap && ./hypersnap.sh down" },
        { label: "Local info", command: "curl http://localhost:3381/v1/info | jq ." },
      ],
      requirements:
        hypersnapRepo?.sourceFacts.nodeRequirements?.length
          ? hypersnapRepo.sourceFacts.nodeRequirements
          : extractRequirementBullets(""),
      ports: ["3381/tcp HTTP — private or authenticated", "3382/udp peer gossip", "3383/tcp gRPC — private or authenticated"],
      noRewardsNotice:
        "Running a node does not automatically guarantee rewards. Consult current official eligibility and participation guidance; proposals are not a promise of payment.",
    },
    repos: repoSnapshots,
  };

  validateSnapshot(snapshot, previous);
  if (Date.now() - startedAt > 180_000) throw new Error("Source collection runtime budget exceeded");
  await atomicWriteSnapshot(OUT_FILE, snapshot);
  console.log(JSON.stringify({ repos: repoSnapshots.map((repo) => ({ name: repo.name, sourceCommit: repo.sourceCommit ?? null, isEmpty: repo.isEmpty, docs: repo.docsLinks.length })), collectedAt: snapshot.collectedAt, sourceUpdatedAt, requests: client.requests, bytes: client.bytes }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    // Never print execFile errors with captured credential output or upstream bodies.
    console.error(`Source sync failed: ${error.message.split("\n")[0]}`);
    process.exitCode = 1;
  });
}
