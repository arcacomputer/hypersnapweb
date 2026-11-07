import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { development, statusLabels } from "../src/data/development.ts";
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("editorial snapshot has an exact UTC check time and pinned main", () => {
  assert.match(development.checkedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.ok(Number.isFinite(Date.parse(development.checkedAt)));
  assert.match(development.mainCommit, /^[a-f0-9]{40}$/);
});
test("every development has a unique permalink, evidence level and source trail", () => {
  const ids = development.updates.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 8);
  for (const item of development.updates) {
    assert.match(item.id, /^[a-z][a-z0-9-]+$/);
    assert.ok(statusLabels[item.status]);
    assert.ok(item.title && item.summary && item.evidence && item.area);
    assert.match(item.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(item.date <= development.checkedAt.slice(0, 10));
    assert.ok(item.sources.length > 0);
    for (const url of [item.url, ...item.sources.map((entry) => entry.url)]) {
      const parsed = new URL(url);
      assert.equal(parsed.protocol, "https:");
      assert.equal(parsed.hostname, "github.com");
      assert.ok(parsed.pathname.startsWith("/farcasterorg/") || parsed.pathname.startsWith("/orgs/farcasterorg/"));
    }
  }
});
test("the four checked unmerged implementations remain proposals", () => {
  for (const number of [60, 61, 62, 63]) {
    const item = development.updates.find((entry) => entry.url === `https://github.com/farcasterorg/hypersnap/pull/${number}`);
    assert.ok(item, `PR ${number} is included`);
    assert.equal(item.status, "proposal");
    assert.match(item.evidence, /provisional|Open|activation|Activation/);
  }
});
test("all six ecosystem repositories have distinct roles", () => {
  assert.deepEqual(development.repos.map((repo) => repo.name).sort(), ["client-snapshot", "hypersnap", "hypersnap-docs-web", "miniapps", "protocol", "snap"]);
  for (const repo of development.repos) assert.ok(repo.role.length > 40);
});
test("metadata synchronization cannot silently advance the editorial date", () => {
  assert.doesNotMatch(source("scripts/sync-sources.mjs"), /writeFile[^\n]*development\.ts/);
  assert.match(source("src/components/pages/updates-page.tsx"), /metadata refresh does not advance/);
});
test("homepage stays server-rendered and does not fetch token-market data", () => {
  const page = source("src/pages/index.astro");
  assert.doesNotMatch(page, /client:|getSnapMarketData/);
  assert.match(source("src/layouts/BaseLayout.astro"), /Navigation without JavaScript/);
});
test("development is discoverable in navigation, sitemap and machine-readable index", () => {
  for (const file of ["src/layouts/BaseLayout.astro", "src/pages/sitemap.xml.ts", "src/lib/llms.ts"])
    assert.match(source(file), /\/updates/);
});
test("public source and endpoint configuration contain no retired or private operator target", () => {
  for (const file of ["src/lib/network.ts", "src/data/development.ts", "src/components/pages/home-page.tsx", "src/components/pages/network-page.tsx"])
    assert.doesNotMatch(source(file), /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}|BEGIN (?:OPENSSH |RSA )?PRIVATE KEY/);
});
