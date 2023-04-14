import * as esbuild from "esbuild";
import { formatMessagesSync } from "esbuild";
import { vanillaExtractPlugin } from "@vanilla-extract/esbuild-plugin";
import packageJson from "./package.json" assert { type: "json" };

const watch = process.argv.includes("--watch");

/**
 * @type {esbuild.BuildOptions}
 */
const cfg = {
  entryPoints: [
    "src/index.ts",
    "src/browser/index.ts",
    "src/embedded/index.ts",
  ],
  plugins: [
    vanillaExtractPlugin({
      // runtime: true
    }),
  ],
  mainFields: ["browser", "module", "main"],
  tsconfig: "tsconfig.build.json",
  logLevel: "info",
  color: true,
  allowOverwrite: true,
  chunkNames: "chunks/[name]-[hash]",
  bundle: true,
  splitting: true,
  platform: "browser",
  format: "esm",
  outdir: "dist",
  sourcemap: false,
  sourcesContent: false,
  treeShaking: true,
  external: [
    ...Object.keys(packageJson.dependencies),
    ...Object.keys(packageJson.peerDependencies),
  ],
};

if (!watch) {
  const bundle = await esbuild.build(cfg);
  if (bundle.errors.length || bundle.warnings.length) {
    console.error(
      [
        ...formatMessagesSync(bundle.warnings, {
          kind: "warning",
          color: true,
          terminalWidth: process.stdout.columns,
        }),
        ...formatMessagesSync(bundle.errors, {
          kind: "error",
          color: true,
          terminalWidth: process.stdout.columns,
        }),
      ].join("\n")
    );
    console.error("\n ⛔️ Build failed");
    process.exit(1);
  }
  process.exit(0);
}

const ctx = await esbuild.context(cfg);
await ctx.watch();
console.info(" 👀 watching...");
