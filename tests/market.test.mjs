import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTs } from "./network-test-helpers.mjs";
const snap = await loadTs("src/lib/snap.ts");
const load = (fetch) => loadTs("src/lib/snap-market.ts", { modules: { "@/lib/snap": snap }, globals: { fetch } });
// Synthetic provider fixtures; these are not live market observations.
test("market route preserves legacy fields without invented supply or protocol adoption", async () => {
  const module = await load(async () => Response.json({ pair: { priceUsd: "0.01", priceNative: "0.000003", fdv: 5000, liquidity: { usd: 100 }, priceChange: { h24: -5 }, txns: { h24: { buys: 2, sells: 3 } }, url: "javascript:alert(1)" } }));
  const value = await module.getSnapMarketData();
  assert.equal(value.ok, true);
  assert.equal(value.market.priceUsd, .01);
  for (const field of ["trueFdv", "correctedFdv", "fdvMultiple"]) assert.equal(value.market[field], null);
  assert.equal(value.market.dexscreenerFdv, 5000);
  assert.equal(value.market.priceChange24h, -5);
  assert.equal(value.market.txns24h.total, 5);
  assert.equal(value.sourceUrl, snap.SNAP.dexscreenerUrl);
  assert.equal(value.attribution.protocolAdoption, "unverified");
  assert.equal(value.attribution.supply, "unverified");
  assert.equal(snap.correctedSnapFdv(.01), null);
});
test("missing, empty, negative or invalid prices cannot produce market success", async () => {
  for (const pair of [{}, { priceUsd: "" }, { priceUsd: -1 }, { priceUsd: "NaN" }, { priceUsd: null }]) {
    const module = await load(async () => Response.json({ pair }));
    assert.equal((await module.getSnapMarketData()).ok, false);
  }
});
test("provider and transport failures remain failures", async () => {
  for (const fetch of [async () => new Response("unavailable", { status: 503 }), async () => { throw new Error("fixture timeout"); }]) {
    const module = await load(fetch);
    const value = await module.getSnapMarketData();
    assert.equal(value.ok, false);
    assert.ok(value.error);
    assert.equal(value.market, undefined);
  }
});
test("market requests retain an eight-second abort signal", async () => {
  let calls = 0;
  const module = await load(async (url, options) => {
    calls++; assert.equal(url, snap.SNAP.dexscreenerApiUrl); assert.ok(options.signal);
    return Response.json({ pairs: [{ priceUsd: ".1" }] });
  });
  assert.equal((await module.getSnapMarketData()).ok, true);
  assert.equal(calls, 1);
});
