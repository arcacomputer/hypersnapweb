import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveGithubToken } from "../scripts/sync-sources.mjs";

test("source-sync entry credential resolver works with only CI GITHUB_TOKEN and no stored CLI account", () => {
  const environment = { CI: "true", GITHUB_TOKEN: "fixture-not-a-credential", GH_CONFIG_DIR: "/nonexistent-fixture-gh", PATH: "" };
  assert.equal(resolveGithubToken({ environment }), "fixture-not-a-credential");
});
test("explicit GH_TOKEN takes precedence without invoking stored-account lookup", () => {
  assert.equal(resolveGithubToken({ environment: { GH_TOKEN: "fixture-first", GITHUB_TOKEN: "fixture-second" }, execute: () => { throw new Error("must not run"); } }), "fixture-first");
});
test("CI missing credentials fails without trying another account", () => {
  let calls = 0;
  assert.throws(() => resolveGithubToken({ environment: { CI: "true" }, execute: () => { calls++; return "unexpected"; } }), /requires GH_TOKEN or GITHUB_TOKEN/);
  assert.equal(calls, 0);
});
test("local fallback selects arcabotai without changing shared login and redacts execution errors", () => {
  let calls = 0;
  const value = resolveGithubToken({ environment: {}, execute: (command, args, options) => {
    calls++; assert.equal(command, "gh"); assert.deepEqual(args, ["auth", "token", "--user", "arcabotai"]);
    assert.equal(options.timeout, 10_000); return "fixture-local\n";
  } });
  assert.equal(value, "fixture-local"); assert.equal(calls, 1);
  assert.throws(() => resolveGithubToken({ environment: {}, execute: () => { throw new Error("fixture-sensitive-output"); } }), (error) => !error.message.includes("sensitive") && /unavailable/.test(error.message));
});
