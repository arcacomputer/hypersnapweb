import { getDocsTree, sources } from "./sources";
import { SITE_URL } from "./seo";

export function renderLlmsIndex() {
  const sections = getDocsTree();
  const lines: string[] = [];

  lines.push("# Hypersnap");
  lines.push("");
  lines.push(
    "> Hypersnap develops open-source node infrastructure and APIs for independent Farcaster clients. Shared formats do not guarantee complete feature or deployment parity. See /updates for dated source evidence and proposal status.",
  );
  lines.push("");
  lines.push("## About this index");
  lines.push("");
  lines.push(
    "This file is the LLM-friendly index of Hypersnap's documentation. Every page below mirrors a markdown file in the open repository at github.com/farcasterorg/hypersnap-docs-web. The single concatenated source is at /llms-full.txt.",
  );
  lines.push("");
  lines.push(`Source repository: ${sources.organization.url}/hypersnap-docs-web`);
  lines.push(`Last synced: ${sources.sourceUpdatedAt}`);
  lines.push("");

  for (const section of sections) {
    lines.push(`## ${section.section}`);
    lines.push("");
    for (const link of section.links) {
      lines.push(`- [${link.title}](${SITE_URL}/docs/${link.slug}): ${link.section} reference.`);
    }
    lines.push("");
  }

  lines.push(`Editorial evidence: ${SITE_URL}/updates (merged source, proposals and deployment are separate).`);
  lines.push(`Economics research: ${SITE_URL}/snap (no guaranteed rewards; external token provenance is separate).`);
  lines.push("## Project surfaces");
  lines.push("");
  lines.push(`- [About Hypersnap](${SITE_URL}/about): What it is, why it exists, who builds it.`);
  lines.push(`- [Selected public endpoint observations](${SITE_URL}/network): Public node, endpoints, shard data.`);
  lines.push(
    `- [Run a node](${SITE_URL}/run-a-node): Bootstrap, operator toolkit, doctor command, and runbook for node operators.`,
  );
  lines.push(
    `- [Install helper](${SITE_URL}/install.sh): One-line installer for the open-source hypersnap operator CLI.`,
  );
  lines.push(
    `- [Hypersnap Doctor](https://github.com/arcabotai/hypersnapdoctor): Independent diagnostics, safe repair, and support tooling for node operators.`,
  );
  lines.push(`- [Contribute](${SITE_URL}/contribute): How to help build it.`);
  lines.push("");

  return lines.join("\n");
}

export function renderLlmsFull() {
  const sections = getDocsTree();
  const parts: string[] = [];

  parts.push("# Hypersnap — Full documentation");
  parts.push("");
  parts.push(
    "Hypersnap develops open-source node infrastructure and APIs for independent Farcaster clients. Documentation describes interfaces, not verified availability on every node. Merged source, releases, activation and application correctness require separate evidence.",
  );
  parts.push("");
  parts.push(`Source repository: ${sources.organization.url}/hypersnap-docs-web`);
  parts.push(`Last synced: ${sources.sourceUpdatedAt}`);
  parts.push(`Site index: ${SITE_URL}/llms.txt`);
  parts.push(`Operator guide: ${SITE_URL}/run-a-node`);
  parts.push(`Install helper: ${SITE_URL}/install.sh`);
  parts.push(`Operator toolkit source: https://github.com/arcabotai/hypersnapdoctor`);
  parts.push("");
  parts.push("---");
  parts.push("");

  for (const section of sections) {
    parts.push(`# ${section.section}`);
    parts.push("");

    for (const link of section.links) {
      const markdown = link.contentMarkdown?.trim() ?? "";
      parts.push(`---`);
      parts.push("");
      parts.push(`<!-- ${link.title} -->`);
      parts.push(`<!-- Source: ${link.githubUrl} -->`);
      parts.push(`<!-- Site URL: ${SITE_URL}/docs/${link.slug} -->`);
      parts.push("");
      parts.push(markdown);
      parts.push("");
    }
  }

  return parts.join("\n");
}

export function renderInstallScript() {
  return `#!/usr/bin/env bash
set -euo pipefail

exec bash -c "$(curl -fsSL https://raw.githubusercontent.com/arcabotai/hypersnapdoctor/main/install.sh)"
`;
}
