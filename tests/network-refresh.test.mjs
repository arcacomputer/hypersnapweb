import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { loadTs } from "./network-test-helpers.mjs";

const flush = () => new Promise((resolve) => setImmediate(resolve));
async function harness(fetcher, { hidden = false } = {}) {
  let now = Date.now();
  let cursor = 0;
  const state = [], effects = [], timers = new Map(), listeners = new Map();
  let timerId = 0;
  const document = { hidden, addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: (name) => listeners.delete(name) };
  const window = {
    setTimeout: (fn, delay) => { timers.set(++timerId, { fn, delay, interval: false }); return timerId; },
    setInterval: (fn, delay) => { timers.set(++timerId, { fn, delay, interval: true }); return timerId; },
    clearTimeout: (id) => timers.delete(id), clearInterval: (id) => timers.delete(id),
  };
  const api = await loadTs("src/components/network-status.tsx", { modules: {
    react: { useState: (initial) => { const i = cursor++; if (!(i in state)) state[i] = typeof initial === "function" ? initial() : initial; return [state[i], (value) => { state[i] = value; }]; }, useEffect: (fn) => { if (!effects.length) effects.push(fn); } },
    "@/components/ui": { StatCard: ({ label, value, detail }) => createElement("div", null, label, ": ", value, " ", detail), ShardCard: ({ blockDelay }) => createElement("div", null, "Shard delay: ", blockDelay) },
    "@/lib/format": { compactPeerId: (value) => value ?? "Unavailable", formatBytes: (value) => String(value ?? "Unavailable"), formatExactNumber: (value) => String(value ?? "Unavailable"), formatNumber: (value) => String(value ?? "Unavailable") },
  }, globals: { document, window, fetch: fetcher, Date: class extends Date { static now() { return now; } } } });
  const initial = { ok: true, checkedAt: new Date(now - 100_000_000).toISOString(), endpoint: "https://haatz.quilibrium.com/v1/info", info: { version: "0.16.0", shardInfos: [{ shardId: 0 }] } };
  const props = { initialStatus: initial, initialNodes: [] };
  function render() { cursor = 0; return renderToStaticMarkup(api.NetworkStatusGrid(props)); }
  render();
  const cleanup = effects[0]();
  return { api, initial, state, timers, document, render, cleanup, advance(ms) { now += ms; }, visible(value) { document.hidden = !value; listeners.get("visibilitychange")?.(); }, async fire(delay) { const entry = [...timers].find(([, timer]) => timer.delay === delay); assert.ok(entry, `Missing ${delay}ms timer`); const [id, timer] = entry; if (!timer.interval) timers.delete(id); timer.fn(); await flush(); } };
}

test("SSR snapshot refreshes immediately, including hidden startup, and absent delay is unknown", async () => {
  let calls = 0;
  const h = await harness(async () => { calls++; return Response.json({ ok: true, checkedAt: new Date().toISOString(), endpoint: "public", info: { version: "0.16.0", shardInfos: [{ shardId: 0 }] }, nodes: [] }); }, { hidden: true });
  assert.equal(calls, 1);
  assert.match(h.render(), /Stale/);
  await flush();
  assert.match(h.render(), /Latest endpoint observation/);
  assert.match(h.render(), /Max reported block delay: Unknown/);
  assert.match(h.render(), /Shard delay: Unknown/);
  h.cleanup();
  assert.equal(h.timers.size, 0);
});

test("refresh failure preserves old values with explicit stale/error text; recovery clears it", async () => {
  let fail = true;
  const h = await harness(async () => { if (fail) throw new Error("network lost"); return Response.json({ ok: true, checkedAt: new Date().toISOString(), endpoint: "public", info: { version: "0.16.0" }, nodes: [] }); });
  await flush();
  assert.equal(h.state[0], h.initial);
  assert.match(h.render(), /Refresh failed: network lost/);
  assert.match(h.render(), /Public info endpoint: Stale/);
  fail = false;
  await h.fire(60_000);
  assert.match(h.render(), /Latest endpoint observation/);
  h.cleanup();
});

test("valid 503 offline metadata keeps the reported failure, not a false online result", async () => {
  const h = await harness(async () => Response.json({ ok: false, checkedAt: new Date().toISOString(), endpoint: "public", info: null, error: "Operator reports offline", nodes: [] }, { status: 503 }));
  await flush();
  assert.match(h.render(), /Unavailable/);
  assert.match(h.render(), /Operator reports offline/);
  assert.doesNotMatch(h.render(), /Refresh failed/);
  h.cleanup();
});

test("a hanging request aborts after 15 seconds; visibility cannot create overlapping requests", async () => {
  let calls = 0;
  const h = await harness(async (_url, { signal }) => {
    calls++;
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => { const error = new Error("aborted"); error.name = "AbortError"; reject(error); }));
  });
  h.advance(60_000);
  h.visible(true); h.visible(true);
  assert.equal(calls, 1);
  await h.fire(15_000);
  assert.match(h.render(), /timed out/);
  await h.fire(60_000);
  assert.equal(calls, 2);
  h.cleanup();
  await flush();
  assert.equal(h.timers.size, 0);
});

test("background polls pause; repeated focus events respect the one-minute attempt bound", async () => {
  let calls = 0;
  const h = await harness(async () => { calls++; return Response.json({ ok: true, checkedAt: new Date().toISOString(), endpoint: "public", info: { version: "0.16.0" }, nodes: [] }); });
  await flush();
  h.visible(false);
  await h.fire(60_000);
  assert.equal(calls, 1);
  h.advance(60_000);
  h.visible(true); h.visible(true);
  await flush();
  assert.equal(calls, 2);
  h.visible(true);
  assert.equal(calls, 2);
  h.advance(100_000);
  await h.fire(15_000);
  assert.match(h.render(), /Stale/);
  h.cleanup();
});

test("malformed refresh response is rejected with stale semantics", async () => {
  const h = await harness(async () => Response.json({}));
  await flush();
  assert.match(h.render(), /Unexpected status response/);
  assert.equal(h.api.isStatusPayload({ ok: true, checkedAt: new Date().toISOString(), endpoint: "x", info: { shardInfos: "bad" } }), false);
  assert.equal(h.state[0], h.initial);
  h.cleanup();
});
