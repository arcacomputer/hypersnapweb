import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { writeSnapshotIfChanged } from "../scripts/sync-sources.mjs";

function snapshot() {
  return {
    schemaVersion: 1,
    collectedAt: "2026-01-01T00:00:00.000Z",
    sourceUpdatedAt: "2025-12-31T12:00:00Z",
    organization: { publicRepoCount: 1 },
    repos: [{ name: "hypersnap-docs-web", sourceCommit: "a".repeat(40), docsLinks: [
      { slug: "introduction", contentHtml: "<p>Accepted</p>", contentMarkdown: "Accepted" },
    ] }],
  };
}

async function withSnapshot(run) {
  const dir = await mkdtemp(path.join(process.env.TMPDIR, "sync-noop-"));
  const file = path.join(dir, "snapshot.json");
  const previous = snapshot();
  // Deliberately different formatting: a no-op must preserve the exact bytes.
  const accepted = `${JSON.stringify(previous, null, 4)}\r\n`;
  await writeFile(file, accepted);
  try { await run({ dir, file, previous, accepted }); }
  finally { await rm(dir, { recursive: true, force: true }); }
}

test("timestamp-only refresh leaves the accepted file, timestamp, inode and mtime untouched", async () => {
  await withSnapshot(async ({ dir, file, previous, accepted }) => {
    const before = await stat(file, { bigint: true });
    const candidate = { ...previous, collectedAt: "2026-01-02T00:00:00.000Z" };
    assert.equal(await writeSnapshotIfChanged(file, candidate, previous), false);
    assert.equal(await readFile(file, "utf8"), accepted);
    const after = await stat(file, { bigint: true });
    assert.equal(after.ino, before.ino);
    assert.equal(after.mtimeNs, before.mtimeNs);
    assert.deepEqual(await readdir(dir), ["snapshot.json"]);
    assert.equal(candidate.collectedAt, "2026-01-02T00:00:00.000Z");
    assert.equal(previous.collectedAt, "2026-01-01T00:00:00.000Z");
  });
});

test("object-key order and omitted undefined properties do not manufacture content changes", async () => {
  await withSnapshot(async ({ file, previous, accepted }) => {
    const candidate = Object.fromEntries(Object.entries(previous).reverse());
    candidate.organization = { unused: undefined, publicRepoCount: 1 };
    candidate.collectedAt = "2026-01-02T00:00:00.000Z";
    assert.equal(await writeSnapshotIfChanged(file, candidate, previous), false);
    assert.equal(await readFile(file, "utf8"), accepted);
  });
});

for (const [name, change] of [
  ["source commit", (value) => { value.repos[0].sourceCommit = "b".repeat(40); }],
  ["document content", (value) => { value.repos[0].docsLinks[0].contentHtml = "<p>Updated</p>"; }],
  ["upstream timestamp", (value) => { value.sourceUpdatedAt = "2026-01-02T00:00:00Z"; }],
  ["new metadata", (value) => { value.repos[0].stars = 1; }],
  ["nested collectedAt", (value) => { value.organization.collectedAt = "2026-01-02T00:00:00Z"; }],
]) {
  test(`a real ${name} change is still atomically published with the new collection date`, async () => {
    await withSnapshot(async ({ dir, file, previous }) => {
      const candidate = structuredClone(previous);
      candidate.collectedAt = "2026-01-02T00:00:00.000Z";
      change(candidate);
      assert.equal(await writeSnapshotIfChanged(file, candidate, previous), true);
      assert.deepEqual(JSON.parse(await readFile(file, "utf8")), candidate);
      assert.deepEqual(await readdir(dir), ["snapshot.json"]);
    });
  });
}

test("validation still fails closed before treating a refresh as unchanged", async () => {
  await withSnapshot(async ({ file, previous, accepted }) => {
    const candidate = structuredClone(previous);
    candidate.repos[0].docsLinks = [];
    await assert.rejects(writeSnapshotIfChanged(file, candidate, previous), /Previously rendered doc missing/);
    assert.equal(await readFile(file, "utf8"), accepted);
  });
});

test("serialization failure preserves accepted bytes and leaves no temporary files", async () => {
  await withSnapshot(async ({ dir, file, previous, accepted }) => {
    const candidate = { ...previous, invalid: 1n };
    await assert.rejects(writeSnapshotIfChanged(file, candidate, previous), /BigInt/);
    assert.equal(await readFile(file, "utf8"), accepted);
    assert.deepEqual(await readdir(dir), ["snapshot.json"]);
  });
});

test("first accepted snapshot is written when there is no previous snapshot", async () => {
  await withSnapshot(async ({ file }) => {
    const candidate = snapshot();
    assert.equal(await writeSnapshotIfChanged(file, candidate, undefined), true);
    assert.deepEqual(JSON.parse(await readFile(file, "utf8")), candidate);
  });
});
