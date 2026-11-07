import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the shared desktop, mobile and no-JS navigation includes a plainly named SNAP guide", () => {
  const layout = source("src/layouts/BaseLayout.astro");
  assert.match(layout, /href: "\/snap", label: "\$SNAP"/);
  assert.match(layout, /Navigation without JavaScript/);
  for (const route of ["about", "docs", "run-a-node", "updates", "network", "contribute"]) assert.ok(layout.includes(`href: "/${route}"`));
});
test("the first screen explains the project and links directly to the main starting points", () => {
  const hero = source("src/components/hero/hero-section.tsx");
  assert.match(hero, /Hypersnap<\/span>/);
  assert.match(hero, /community-built fork of Farcaster/);
  for (const route of ["about", "snap", "run-a-node", "docs"]) assert.ok(hero.includes(`href="/${route}"`));
  assert.doesNotMatch(hero, /GitCommit|mainCommit|development\.summary/);
  const home = source("src/components/pages/home-page.tsx");
  assert.ok(home.indexOf('className="hs-path-section"') < home.indexOf('aria-labelledby="hs-updates-title"'));
  assert.ok(home.includes('title: "$SNAP, explained"'));
});
test("token guide keeps source dates, contract and old deep links without unsupported valuation claims", () => {
  const snap = source("src/components/pages/snap-page.tsx");
  assert.match(snap, /\$SNAP,/);
  for (const id of ["evidence", "research", "names", "external-listing", "open-questions"]) assert.ok(snap.includes(`id="${id}"`));
  for (const value of ["SNAP.contract", "SNAP.explorerUrl", "SNAP.checkedAt", "SNAP.discussions", "not independently verified", "not a promise of earnings"]) assert.ok(snap.includes(value), value);
  assert.doesNotMatch(snap, /200B|200M|33M|connectWallet|claimUrl/);
  assert.ok((snap.match(/<details /g) || []).length >= 4);
});
test("the documentation entry offers token and project guides alongside the complete API tree", () => {
  const docs = source("src/components/pages/docs-index-page.tsx");
  assert.ok(docs.includes('ctaHref="/snap"'));
  assert.ok(docs.includes('href="/about"'));
  assert.ok(docs.includes("sections.map"));
  assert.ok(docs.includes("section.links.map"));
  assert.ok(docs.includes('href="/llms-full.txt"'));
});
