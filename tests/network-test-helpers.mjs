import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
export async function loadTs(relativePath, { modules = {}, globals = {} } = {}) {
  const source = await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }, reportDiagnostics: true });
  assert.equal(compiled.diagnostics?.length ?? 0, 0);
  const module = { exports: {} };
  vm.runInNewContext(compiled.outputText, { module, exports: module.exports, require: (id) => Object.hasOwn(modules, id) ? modules[id] : require(id), console, URL, Date, Error, AbortController, AbortSignal, fetch, setTimeout, clearTimeout, ...globals }, { filename: relativePath });
  return module.exports;
}

export const sourceStub = { publicNode: { baseUrl: "https://haatz.quilibrium.com", infoEndpoint: "/v1/info" } };
