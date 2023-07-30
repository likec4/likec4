import GithubActionsReporter from 'vitest-github-actions-reporter'
import { mergeConfig, defineProject, defineConfig } from 'vitest/config'

const configShared = defineConfig({
  test: {
    reporters: process.env.GITHUB_ACTIONS ? ['default', new GithubActionsReporter()] : 'default',
    snapshotFormat: {
      highlight: true,
      escapeString: false
    }
  }
})

export default configShared

export function vitestProject(name: string) {
  return mergeConfig(
    configShared,
    defineProject({
      test: {
        name
      }
    })
  )
}
