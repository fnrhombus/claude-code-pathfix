import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  // CJS-only: this is a bin script, dual-publish doesn't buy anything.
  format: ["cjs"],
  target: "node20",
  clean: true,
  sourcemap: false,
  // Keep the shebang in src/index.ts as-is on the first line of dist/index.cjs.
  // tsup handles this automatically when the source starts with `#!/usr/bin/env node`.
  dts: false,
  minify: false,
  // Do NOT bundle @fnrhombus/claude-code-hooks — it's a real dep, loaded at runtime.
  external: ["@fnrhombus/claude-code-hooks"],
});
