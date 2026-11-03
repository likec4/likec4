import { defineConfig } from '@likec4/devops/tsdown'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export default defineConfig([
  {
    entry: [
      'src/index.ts',
      'src/cli.ts',
    ],
    platform: 'node',
    inputOptions: {
      resolve: {
        conditionNames: ['production', 'sources', 'node', 'import', 'default'],
      },
      onLog(level, log, defaultHandler) {
        if (log.code === 'MODULE_LEVEL_DIRECTIVE') {
          return // Ignore module level directive warnings
        }
        defaultHandler(level, log) // otherwise, just print the log
      },
    },
    dts: false,
  },
  {
    // Browser bundle for the render-view MCP App UI, see src/app-ui/render-view.client.tsx.
    // Bundled as a single IIFE (React + @likec4/diagram included) so it can be
    // inlined into a plain <script> tag inside the resource HTML returned by
    // src/resource/render-view.ts. The paired CSS is copied (not bundled) from
    // @likec4/diagram's pre-built stylesheet, then inlined as a <style> tag.
    entry: {
      'app/render-view-client': 'src/app-ui/render-view.client.tsx',
    },
    platform: 'browser',
    format: 'iife',
    dts: false,
    define: {
      'import.meta': '{}',
    },
    deps: {
      onlyBundle: false,
      alwaysBundle: [/.*/],
    },
    inputOptions: {
      resolve: {
        conditionNames: ['sources', 'module', 'import', 'default'],
      },
      onLog(level, log, defaultHandler) {
        if (log.code === 'MODULE_LEVEL_DIRECTIVE') {
          return // Ignore module level directive warnings
        }
        defaultHandler(level, log) // otherwise, just print the log
      },
    },
    outputOptions: {
      entryFileNames: '[name].js',
    },
    copy: [
      {
        from: require.resolve('@likec4/diagram/styles.css'),
        to: 'dist/app',
        rename: 'render-view-client.css',
      },
    ],
  },
])
