import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  // CJS-only: this is a bin script, dual-publish doesn't buy anything.
  format: ["cjs"],
  target: "node20",
  clean: true,
  sourcemap: false,
  dts: false,
  // Bundle everything — pathfix is a bin script, not a library. One
  // self-contained dist/index.js means faster install (one tarball),
  // faster startup (no cross-package module resolution on every Bash
  // command), and no runtime dep graph for users.
  noExternal: [/.*/],
  // Parsing smaller code is a real startup win for a per-command hook.
  // esbuild minify is fast and non-destructive — just name mangling and
  // whitespace removal, no inlining or dead-code-with-side-effects risk.
  minify: true,
  // Keep the shebang in src/index.ts as-is on the first line of
  // dist/index.js — tsup preserves it automatically.
});
