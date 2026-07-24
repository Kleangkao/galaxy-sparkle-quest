import { copyFile, mkdir, readdir, readFile, rm } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workerSource = resolve(projectRoot, "sites", "worker.js");
const workerOutput = resolve(projectRoot, "dist", "server", "index.js");
const clientOutput = resolve(projectRoot, "dist", "client");
const publicAssets = resolve(clientOutput, "assets");

await mkdir(dirname(workerOutput), { recursive: true });
await copyFile(workerSource, workerOutput);

// Vite copies everything from public/. The source artwork archive is intentionally
// preserved, but the deployed website only needs files referenced by built code.
const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat();
};

const clientFiles = await listFiles(clientOutput);
const searchable = clientFiles.filter((file) => [".html", ".js", ".css", ".json"].includes(extname(file)));
const referencedAssets = new Set();
for (const file of searchable) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/\/assets\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+/g)) {
    const rawPath = match[0].replace(/^\/assets\//, "").split(/[)"'?#]/)[0];
    try {
      referencedAssets.add(decodeURI(rawPath));
    } catch {
      referencedAssets.add(rawPath);
    }
  }
}

let pruned = 0;
for (const file of await listFiles(publicAssets)) {
  const key = relative(publicAssets, file).split(sep).join("/");
  // Hashed Vite bundles live directly in assets/ and must always be retained.
  if (!key.includes("/") || referencedAssets.has(key)) continue;
  await rm(file);
  pruned += 1;
}
console.log(`[sites] Preserved source artwork; omitted ${pruned} unused public assets from this deployment.`);
