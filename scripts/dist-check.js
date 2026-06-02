#!/usr/bin/env node
/**
 * Pre-publish check: validates that `dist/` exists and contains the
 * expected static export artifacts produced by `next build`.
 * Exits with code 1 (and a readable message) if anything is missing.
 */
const fs = require("fs");
const path = require("path");

const DIST = path.resolve(__dirname, "..", "dist");
const REQUIRED = ["_next"];
const RECOMMENDED = ["index.html"];
const REQUIRED_ROUTES = ["login", "chat", "dashboard"]; // optional — warn only

function fail(msg) {
  console.error(`\n[dist-check] ❌ ${msg}`);
  console.error(`[dist-check] Run \`npm run build\` and try again.\n`);
  process.exit(1);
}

if (!fs.existsSync(DIST) || !fs.statSync(DIST).isDirectory()) {
  fail(`Pasta dist/ não encontrada em ${DIST}.`);
}

for (const entry of REQUIRED) {
  const p = path.join(DIST, entry);
  if (!fs.existsSync(p)) fail(`Arquivo/pasta obrigatório ausente: dist/${entry}`);
}

const nextStatic = path.join(DIST, "_next", "static");
if (!fs.existsSync(nextStatic)) fail("dist/_next/static não foi gerado — build incompleto.");

const htmls = fs.readdirSync(DIST).filter((f) => f.endsWith(".html"));
if (htmls.length === 0) fail("Nenhum arquivo .html exportado em dist/.");

const warnings = [];
for (const rec of RECOMMENDED) {
  if (!fs.existsSync(path.join(DIST, rec))) warnings.push(`recomendado ausente: dist/${rec}`);
}
for (const route of REQUIRED_ROUTES) {
  const htmlFlat = path.join(DIST, `${route}.html`);
  const htmlDir = path.join(DIST, route, "index.html");
  if (!fs.existsSync(htmlFlat) && !fs.existsSync(htmlDir)) {
    warnings.push(`rota /${route} não foi exportada`);
  }
}

console.log("[dist-check] ✅ dist/ válido");
console.log(`[dist-check]    - ${htmls.length} arquivo(s) .html na raiz`);
console.log(`[dist-check]    - _next/static presente`);
if (warnings.length) {
  console.log("[dist-check] ⚠️  Avisos:");
  warnings.forEach((w) => console.log(`[dist-check]    - ${w}`));
}
