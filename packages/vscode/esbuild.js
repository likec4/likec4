//@ts-check
const { build: esbuild } = require('esbuild')
// import inlineWorkerPlugin from 'esbuild-plugin-inline-worker';
// import lodashTransformer from 'esbuild-plugin-lodash';

const watch = process.argv.includes('--watch');
const minify = process.argv.includes('--minify');

const nodeBuild = esbuild({
  entryPoints: {
    'index': 'src/extension/node/index.ts',
    'server': 'src/extension/node/server.ts'
  },
  outdir: 'dist/node',
  bundle: true,
  external: ['vscode'],
  format: 'cjs',
  target: 'node16',
  platform: 'node',
  plugins: [
    // lodashTransformer()
  ],
  sourcemap: minify ? false : 'inline',
  sourcesContent: false,
  watch: watch ? {
      onRebuild(error) {
          if (error) console.error(`Node watch build failed`, error)
          else console.log(`Node watch build successful`)
      }
  } : false,
  minify
})
    // .then(() => console.log(`Node build successful`))
    // .catch(() => process.exit(1));


const browserBuild = esbuild({
  entryPoints: {
    'index': 'src/extension/browser/index.ts',
    'server': 'src/extension/browser/server.ts',
    // 'elk': require.resolve('elkjs/lib/elk-worker.min')
  },
  outdir: 'dist/browser',
  bundle: true,
  format: 'cjs',
  external: ['vscode'],
  mainFields: ['browser', 'module', 'main'],
  alias: {
    'path': 'path-browserify'
  },
  // plugins: [
  //   inlineWorkerPlugin(),
  // ],
  sourcemap: minify ? false : 'inline',
  sourcesContent: false,
  watch: watch ? {
    onRebuild(error) {
        if (error) console.error(`Browser watch build failed`, error)
        else console.log(`Browser watch build successful`)
    }
  } : false,
  minify
})

Promise.allSettled([nodeBuild,browserBuild])
  .then(([node, browser]) => {
    if (node.status === 'rejected') {
      console.error('Node build failed');
      console.error(node.reason);
    } else {
      node.value.warnings.forEach(warning => console.warn(warning.text));
      console.info('Node build successful');
    }
    if (browser.status === 'rejected') {
      console.error('Browser build failed');
      console.error(browser.reason);
    } else {
      browser.value.warnings.forEach(warning => console.warn(warning.text));
      console.info('Browser build successful');
    }
    if (node.status === 'rejected' || browser.status === 'rejected') {
      process.exit(1)
    }

    if (watch) {
      console.info('Watching...');
    }
  })
  .catch(() => process.exit(1))
