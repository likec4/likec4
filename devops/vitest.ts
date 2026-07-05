import { defu } from 'defu'
import {
  type UserWorkspaceConfig,
  defineConfig,
  defineProject as defineVitestProject,
  mergeConfig,
} from 'vitest/config'

const sharedConfig = defineConfig({
  ssr: {
    resolve: {
      conditions: ['sources'],
    },
  },
  test: {
    slowTestThreshold: 1000,
    chaiConfig: {
      truncateThreshold: 100,
    },
    maxWorkers: '90%',
    // diff: {
    //   omitAnnotationLines: true,
    //   contextLines: 6,
    // },
  },
})

export function defineVitest(name: string, config?: UserWorkspaceConfig) {
  return mergeConfig(
    sharedConfig,
    defineVitestProject(
      defu(
        config,
        {
          test: {
            name,
          },
        },
      ),
    ),
  )
}
