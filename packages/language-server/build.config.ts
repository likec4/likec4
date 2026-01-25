import { defineBuildConfig } from 'obuild/config'

export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: [
        './src/index.ts',
        './src/common-exports.ts',
        './src/bundled.ts',
        './src/browser-worker.ts',
        './src/browser.ts',
        './src/ast.ts',
        './src/module.ts',
        './src/protocol.ts',
        './src/likec4lib.ts',
        './src/LikeC4LanguageServices.ts',
        './src/filesystem/index.ts',
        './src/mcp/index.ts',
        './src/generated/ast.ts',
        './src/generated/grammar.ts',
        './src/generated/module.ts',
        './src/generated-lib/icons.ts',
      ],
      rolldown: {
        platform: 'neutral',
        resolve: {
          mainFields: ['module', 'main'],
        },
        // treeshake: {
        //   moduleSideEffects: 'no-external',
        //   // unknownGlobalSideEffects: false,
        //   // propertyReadSideEffects: false,
        //   // propertyWriteSideEffects: false,
        // },
      },
      // dts: {
      //   build: true,
      //   resolver: 'tsc',
      // },
    },
  ],
}) as unknown
