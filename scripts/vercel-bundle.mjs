import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function resolveWithExtensions(basePath) {
  const exts = [".ts", ".tsx", ".mts", ".cts"];
  for (const ext of exts) {
    const p = basePath + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  for (const ext of exts) {
    const p = path.join(basePath, `index${ext}`);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}

/** Resolves tsconfig-style `@/…` imports to `./src/…` for Vercel (Node has no path aliases). */
const aliasAtPlugin = {
  name: "alias-at-slash",
  setup(build) {
    build.onResolve({ filter: /^@\// }, (args) => {
      const rel = args.path.slice(2);
      const base = path.join(root, "src", rel);
      const resolved = resolveWithExtensions(base);
      if (!resolved) {
        throw new Error(`[alias-at-slash] Cannot resolve import: ${args.path}`);
      }
      return { path: resolved };
    });
  },
};

await esbuild.build({
  entryPoints: [path.join(root, "src", "app.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: path.join(root, "api", "_app.mjs"),
  plugins: [aliasAtPlugin],
  packages: "external",
  logLevel: "info",
});

console.log("✓ Bundled src/app.ts → api/_app.mjs (@/ → src/, node_modules external)");
