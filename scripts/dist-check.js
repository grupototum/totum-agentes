#!/usr/bin/env node
/**
 * Pre-publish check: validates that `dist/` exists and contains the
 * expected static export artifacts produced by `next build`.
 * Exits with code 1 (and a readable message) if anything is missing.
 */
const fs = require("fs");
const path = require("path");

const DIST = path.resolve(__dirname, "..", "dist");
const REQUIRED = ["index.html", "404.html", "_next"];
const REQUIRED_ROUTES = ["login", "chat", "dashboard"]; // optional routes — warn only

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

const nextDir = path.join(DIST, "_next");
const hasChunks = fs.existsSync(path.join(nextDir, "static"));
if (!hasChunks) fail("dist/_next/static não foi gerado — build incompleto.");

const indexSize = fs.statSync(path.join(DIST, "index.html")).size;
if (indexSize < 200) fail(`dist/index.html parece vazio (${indexSize} bytes).`);

const warnings = [];
for (const route of REQUIRED_ROUTES) {
  const htmlFlat = path.join(DIST, `${route}.html`);
  const htmlDir = path.join(DIST, route, "index.html");
  if (!fs.existsSync(htmlFlat) && !fs.existsSync(htmlDir)) {
    warnings.push(`rota /${route} não foi exportada`);
  }
}

console.log("[dist-check] ✅ dist/ válido");
console.log(`[dist-check]    - index.html (${indexSize} bytes)`);
console.log(`[dist-check]    - _next/static presente`);
if (warnings.length) {
  console.log("[dist-check] ⚠️  Avisos:");
  warnings.forEach((w) => console.log(`[dist-check]    - ${w}`));
}
