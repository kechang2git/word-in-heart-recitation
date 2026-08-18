import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server renders Word in Heart metadata and app root", async () => {
  const response = await render(); assert.equal(response.status, 200); assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text(); assert.match(html, /Word in Heart/); assert.match(html, /藏在心裡/); assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("PWA manifest and service worker describe installable offline app", async () => {
  const [manifestText, worker] = await Promise.all([readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"), readFile(new URL("../public/sw.js", import.meta.url), "utf8")]);
  const manifest = JSON.parse(manifestText); assert.equal(manifest.display, "standalone"); assert.equal(manifest.start_url, "/"); assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.match(worker, /word-in-heart-pwa-v1/); assert.match(worker, /caches\.match/); assert.match(worker, /request\.mode === "navigate"/);
});
