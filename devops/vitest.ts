import { defu } from 'defu'
import { resolve } from 'pathe'
import {
  type UserWorkspaceConfig,
  defineConfig,
  defineProject as defineVitestProject,
  mergeConfig,
} from 'vitest/config'

const __dirname = import.meta.dirname

const packages = (packageName: string, ...paths: string[]) =>
  resolve(__dirname, '..', 'packages', packageName, ...paths)
const src = (packageName: string) => packages(packageName, 'src')

const sharedConfig = defineConfig({
  resolve: {
    conditions: ['sources', 'development'],
    alias: {
      '@likec4/core': src('core'),
      '@likec4/config': src('config'),
      '@likec4/generator': src('generators'),
      '@likec4/layouts': src('layouts'),
      '@likec4/language-server': src('language-server'),
      '@likec4/language-services': src('language-services'),
      '@likec4/vite-plugin': src('vite-plugin'),
      '@likec4/log': src('log'),
    },
  },
  test: {
    diff: {
      omitAnnotationLines: true,
      contextLines: 6,
    },
    snapshotFormat: {
      escapeString: false,
    },
    isolate: false,
    maxConcurrency: 10,
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
