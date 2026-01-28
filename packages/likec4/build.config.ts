import { copyFile, mkdir } from 'node:fs/promises'
import { defineBuildConfig } from 'obuild/config'
import { isProduction } from 'std-env'

if (!isProduction) {
  console.warn('Bundling CLI in development mode')
}

export default defineBuildConfig({
  entries: [{
    type: 'bundle',
    input: [
      'src/cli/index.ts',
      'src/config/index.ts',
      'src/model/builder.ts',
      'src/model/index.ts',
      'src/vite-plugin/internal.ts',
      'src/vite-plugin/index.ts',
      'src/index.ts',
    ],
    minify: {
      mangle: {
        keepNames: {
          class: true,
          function: true,
        },
      },
    },
    rolldown: {
      platform: 'node',
      tsconfig: 'tsconfig.cli.json',
      resolve: {
        mainFields: ['module', 'main'],
        conditionNames: ['production', 'sources', 'node', 'import', 'default'],
      },
    },
    dts: {
      // resolver: 'tsc',
      tsconfig: 'tsconfig.cli.json',
    },
  }],
  hooks: {
    end: async () => {
      await copyFile('./src/vite-plugin/modules.d.ts', './vite-plugin-modules.d.ts')
      await mkdir('./config', { recursive: true })
      await copyFile('../config/schema.json', './config/schema.json')
    },
  },
}) as unknown
