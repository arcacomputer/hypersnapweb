import test from "node:test";
import assert from "node:assert/strict";
import { loadTs, sourceStub } from "./network-test-helpers.mjs";

const load = (fetch) => loadTs("src/lib/network.ts", { modules: { "@/lib/sources": { sources: sourceStub } }, globals: { fetch, AbortSignal: { timeout: (ms) => ({ timeout: ms }) } } });

test("registry contains only four approved public endpoints", async () => {
  const { KNOWN_FARCASTER_NODES } = await load(() => { throw new Error("No real requests allowed"); });
  assert.deepEqual(Array.from(KNOWN_FARCASTER_NODES, (node) => new URL(node.rpcUrl).host), ["haatz.quilibrium.com", "hub-api.neynar.com", "hub.pinata.cloud", "hub.farcaster.standardcrypto.vc"]);
});

test("typed recognizable info accepts current and legacy providers without requiring dbStats", async () => {
  const { isNetworkInfo } = await load();
  for (const value of [{ version: "0.16.0", numShards: 3, shardInfos: [{ shardId: 0, maxHeight: 123, blockDelay: 1 }] }, { version: "1.0" }, { peer_id: "peer" }, { dbStats: { numMessages: 0 } }]) assert.equal(isNetworkInfo(value), true);
  for (const value of [{}, [], null, "ok", { dbStats: {} }, { version: 1 }, { version: "" }, { shardInfos: [{}] }, { version: "x", shardInfos: "bad" }, { dbStats: { numMessages: -1 } }, { version: "x", numShards: NaN }, { shardInfos: [{ shardId: 1, blockDelay: "0" }] }]) assert.equal(isNetworkInfo(value), false, JSON.stringify(value));
});

test("all primary and registry requests use a ten-second timeout", async () => {
  const calls = [];
  const api = await load(async (url, options) => {
    calls.push(url);
    assert.equal(options.signal.timeout, 10_000);
    return Response.json({ version: "0.16.0" });
  });
  assert.equal((await api.getNetworkStatus()).ok, true);
  assert.equal((await api.getNodeHealthStatuses()).length, 4);
  assert.equal(calls.length, 5);
});

test("auth-gated 401/402/403 remain reachable and not offline", async () => {
  for (const code of [401, 402, 403]) {
    const api = await load(async () => new Response("", { status: code }));
    for (const status of await api.getNodeHealthStatuses()) {
      assert.equal(status.state, "auth-gated");
      assert.equal(status.reachable, true);
      assert.equal(status.ok, false);
      assert.match(status.error, new RegExp(`HTTP ${code}`));
    }
  }
});

test("empty responses and explicit offline metadata never turn green; failure text survives", async () => {
  for (const payload of [{}, { version: "0.16.0", status: "offline", error: "upstream is rebuilding" }]) {
    const api = await load(async () => Response.json(payload));
    const primary = await api.getNetworkStatus();
    assert.equal(primary.ok, false);
    assert.equal(primary.info, null);
    if (payload.error) assert.equal(primary.error, payload.error);
    for (const status of await api.getNodeHealthStatuses()) {
      assert.equal(status.state, "degraded");
      assert.equal(status.reachable, true);
      if (payload.error) assert.equal(status.error, payload.error);
    }
  }
});

test("invalid JSON, HTTP failure and timeouts return bounded failures", async () => {
  for (const fetcher of [async () => new Response("bad json"), async () => new Response("", { status: 503 }), async () => { const error = new Error("timeout"); error.name = "TimeoutError"; throw error; }]) {
    const api = await load(fetcher);
    assert.equal((await api.getNetworkStatus()).ok, false);
    assert.ok((await api.getNodeHealthStatuses()).every((status) => !status.ok));
  }
});
