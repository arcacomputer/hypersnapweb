import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createGithubClient, listPublicRepos, getRepoTree, buildRepoSnapshot, atomicWriteSnapshot, validateSnapshot } from "../scripts/sync-sources.mjs";

const endpoint = "https://api.github.com/orgs/farcasterorg";
const sha = "a".repeat(40);

test("GitHub client enforces origin, request/byte budgets and no credential redirects", async () => {
  let calls = 0;
  const client = createGithubClient({ maxRequests: 1, fetchImpl: async (_url, options) => {
    calls++;
    assert.equal(options.redirect, "error");
    assert.ok(options.signal);
    return Response.json({ ok: true });
  } });
  await assert.rejects(client.json("https://example.com"), /origin/);
  assert.equal(calls, 0);
  assert.equal((await client.json(endpoint)).ok, true);
  await assert.rejects(client.json(endpoint), /budget/);
  const oversized = createGithubClient({ maxResponseBytes: 2, fetchImpl: async () => new Response("oversized") });
  await assert.rejects(oversized.text(endpoint), /budget/);
});

test("GitHub requests time out and optional 404 does not hide rate limits or arbitrary conflicts", async () => {
  const keepAlive = setTimeout(() => {}, 100);
  try {
    const client = createGithubClient({ requestTimeoutMs: 5, fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason))) });
    await assert.rejects(client.json(endpoint), /timeout|aborted/i);
  } finally { clearTimeout(keepAlive); }
  for (const status of [403, 429, 500, 409]) {
    const client = createGithubClient({ fetchImpl: async () => new Response("failure", { status }) });
    await assert.rejects(client.json(endpoint, { optional: true }), new RegExp(`HTTP ${status}`));
  }
  assert.equal(await createGithubClient({ fetchImpl: async () => new Response("", { status: 404 }) }).json(endpoint, { optional: true }), null);
  assert.equal(await createGithubClient({ fetchImpl: async () => new Response("", { status: 409 }) }).json(endpoint, { emptyRepo: true }), null);
});

test("public repository pagination reconciles counts and rejects duplicates, missing pages and overflow", async () => {
  const pages = [Array.from({ length: 100 }, (_, i) => ({ name: `repo-${i}` })), [{ name: "repo-100" }]];
  const urls = [];
  const repos = await listPublicRepos({ json: async (url) => { urls.push(url); return pages[urls.length - 1]; } }, 101);
  assert.equal(repos.length, 101);
  assert.match(urls[1], /page=2$/);
  await assert.rejects(listPublicRepos({ json: async () => [] }, 1), /incomplete/);
  await assert.rejects(listPublicRepos({ json: async () => [{ name: "x" }, { name: "x" }] }, 2), /duplicate/);
  let page = 0;
  await assert.rejects(listPublicRepos({ json: async () => Array.from({ length: 100 }, (_, i) => ({ name: `${page++}-${i}` })) }, 1000), /pagination budget/);
});

test("truncated/malformed trees fail closed; empty protocol has no code claims", async () => {
  await assert.rejects(getRepoTree("hypersnap", sha, { json: async () => ({ tree: [], truncated: true }) }), /Incomplete/);
  await assert.rejects(getRepoTree("hypersnap", sha, { json: async () => ({}) }), /Incomplete/);
  const urls = [];
  const repo = await buildRepoSnapshot({ name: "protocol", default_branch: "main", description: "Discussions", html_url: "https://github.com/farcasterorg/protocol" }, { json: async (url) => { urls.push(url); return null; }, text: async () => { throw new Error("Must not fetch code for an empty repo"); } });
  assert.equal(repo.isEmpty, true);
  assert.equal(repo.sourceCommit, undefined);
  assert.equal(repo.docsLinks.length, 0);
  assert.equal(urls.length, 2);
  assert.ok(urls.every((url) => !url.includes("/git/trees/")));
});

test("README, tree, docs and derived links share one immutable commit; renderer preserves slugs and sanitizes HTML", async () => {
  const urls = [];
  const repo = await buildRepoSnapshot({ name: "hypersnap-docs-web", default_branch: "main" }, {
    json: async (url) => {
      urls.push(url);
      if (url.includes("/commits/")) return { sha };
      if (url.includes("/git/trees/")) { assert.match(url, new RegExp(sha)); return { tree: [] }; }
      return null;
    },
    text: async (url) => {
      urls.push(url);
      assert.match(url, new RegExp(`ref=${sha}$`));
      if (url.includes("SUMMARY.md")) return "# Intro\n- [Introduction](./introduction.md)";
      if (url.includes("introduction.md")) return '# Intro\n## Details\n[Next](./getting-started.md#start)\n<script>alert(1)</script>\n<img src="x" onerror="alert(1)">';
      return "Hypersnap documentation https://haatz.quilibrium.com";
    },
  });
  assert.equal(repo.sourceCommit, sha);
  const doc = repo.docsLinks[0];
  assert.equal(doc.slug, "introduction");
  assert.match(doc.githubUrl, new RegExp(`/blob/${sha}/src/introduction.md$`));
  assert.match(doc.contentHtml, /\/docs\/getting-started#start/);
  assert.doesNotMatch(doc.contentHtml, /<script|onerror/);
  assert.equal(doc.toc[0].id, "details");
  assert.ok(urls.every((url) => !url.includes("ref=main")));
});

test("failed document retrieval propagates instead of publishing blank docs", async () => {
  await assert.rejects(buildRepoSnapshot({ name: "hypersnap-docs-web", default_branch: "main" }, { json: async (url) => url.includes("/commits/") ? { sha } : url.includes("/git/trees/") ? { tree: [] } : null, text: async (url) => {
    if (url.includes("SUMMARY.md")) return "- [Introduction](./introduction.md)";
    if (url.includes("introduction.md")) throw new Error("document request failed");
    return "README";
  } }), /document request failed/);
});

test("snapshot validation preserves existing rendered routes; atomic failure preserves accepted JSON", async () => {
  const previous = { repos: [{ name: "hypersnap-docs-web", docsLinks: [{ slug: "existing", contentHtml: "accepted" }] }] };
  assert.throws(() => validateSnapshot({ organization: { publicRepoCount: 1 }, repos: [{ name: "hypersnap-docs-web", docsLinks: [] }] }, previous), /Previously rendered doc missing/);
  const dir = await mkdtemp(path.join(process.env.TMPDIR, "sync-tests-"));
  try {
    const file = path.join(dir, "snapshot.json");
    await writeFile(file, "accepted\n");
    await assert.rejects(atomicWriteSnapshot(file, { invalid: 1n }), /BigInt/);
    assert.equal(await readFile(file, "utf8"), "accepted\n");
    assert.deepEqual(await readdir(dir), ["snapshot.json"]);
    await atomicWriteSnapshot(file, { accepted: true });
    assert.deepEqual(JSON.parse(await readFile(file, "utf8")), { accepted: true });
    assert.deepEqual(await readdir(dir), ["snapshot.json"]);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
