/**
 * Release zip: dist/lhtrpg-automacao.zip with the files Foundry needs (no tools/), plus a copy of
 * module.json next to it.
 *
 *   node tools/package.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "module.json"), "utf8"));
const DIST = path.join(ROOT, "dist");
const STAGE = path.join(DIST, manifest.id);
const FILES = ["module.json", "README.md", "CHANGELOG.md", "LICENSE.txt", "lang", "scripts", "styles", "templates", "assets", "fonts"];

// The download URL must point at this version's release.
if (!manifest.download?.includes(`/v${manifest.version}/`)) {
  throw new Error(`module.json "download" doesn't point at v${manifest.version}`);
}

fs.rmSync(DIST, { recursive: true, force: true });
for (const f of FILES) {
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) throw new Error(`Missing ${f}`);
  fs.cpSync(src, path.join(STAGE, f), { recursive: true });
}
const zip = path.join(DIST, `${manifest.id}.zip`);
// The Windows tar (bsdtar), not a GNU tar from Git/MSYS that reads "C:" as a remote host;
// tar -a picks the zip format from the extension.
const tar = (process.platform === "win32") ? path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe") : "tar";
execFileSync(tar, ["-a", "-c", "-f", path.relative(STAGE, zip), ...FILES], { cwd: STAGE, stdio: "inherit" });
fs.rmSync(STAGE, { recursive: true, force: true });
fs.copyFileSync(path.join(ROOT, "module.json"), path.join(DIST, "module.json"));
const size = fs.statSync(zip).size;
console.log(`${path.relative(ROOT, zip)}: ${(size / 1024).toFixed(0)} KB (${manifest.id} ${manifest.version})`);
