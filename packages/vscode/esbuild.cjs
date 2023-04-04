const esbuild = require("esbuild");
// import inlineWorkerPlugin from 'esbuild-plugin-inline-worker';
// import lodashTransformer from 'esbuild-plugin-lodash';

const watch = process.argv.includes("--watch");
const minify = process.argv.includes("--minify");

let build = watch ? esbuild.build : esbuild.context;

let nodeBuild = esbuild
  .context({
    entryPoints: {
      index: "src/extension/node/index.ts",
      server: "src/extension/node/server.ts",
    },
    outdir: "dist/node",
    bundle: true,
    external: ["vscode"],
    format: "cjs",
    target: "node16",
    platform: "node",
    sourcemap: minify ? false : 'external',
    sourcesContent: minify ? false : true,
    minify,
  })
  .then(async (ctx) => {
    const result = await ctx.rebuild();
    if (result.errors.length > 0) {
      return Promise.reject(result.errors);
    }
    console.info("Node build successful");
    if (watch) {
      console.info("Node build watching");
      return ctx.watch();
    }
  });

let browserBuild = esbuild
  .context({
    entryPoints: {
      index: "src/extension/browser/index.ts",
      server: "src/extension/browser/server.ts",
      // 'elk': require.resolve('elkjs/lib/elk-worker.min')
    },
    outdir: "dist/browser",
    bundle: true,
    format: "cjs",
    external: ["vscode"],
    mainFields: ["browser", "module", "main"],
    alias: {
      path: "path-browserify",
    },
    // plugins: [
    //   inlineWorkerPlugin(),
    // ],
    sourcemap: minify ? false : "inline",
    sourcesContent: false,
    minify,
  })
  .then(async (ctx) => {
    const result = await ctx.rebuild();
    if (result.errors.length > 0) {
      return Promise.reject(result.errors);
    }
    console.info("Browser build successful");
    if (watch) {
      console.info("Browser build watching");
      return ctx.watch();
    }
  });

Promise.allSettled([nodeBuild, browserBuild])
  .then(([node, browser]) => {
    if (node.status === "rejected") {
      console.error("Node build failed");
      console.error(node.reason);
    }
    if (browser.status === "rejected") {
      console.error("Browser build failed");
      console.error(browser.reason);
    }
    if (node.status === "rejected" || browser.status === "rejected") {
      process.exit(1);
    }
    if (!watch) {
      process.exit(0);
    }
  })
  // .catch(() => process.exit(1));
