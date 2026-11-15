// Copy of `packages/language-services/src/__tests__/git-dependency-fixture.ts` (test files are not exported)
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

// Fake `ssh`: runs the remote command (`git-upload-pack '/path'`) locally, in the folder of the fixture.
// Tests never go to the network: `ssh://example.test/<repo>.git` is served from `<root>/<repo>.git`.
const FAKE_SSH = `
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
const command = process.argv.at(-1) ?? ''
const match = /^git[- ](upload-pack) '([^']*)'$/.exec(command)
if (!match) {
  process.stderr.write('fake ssh: unexpected command ' + command + '\\n')
  process.exit(128)
}
const repo = join(process.env.LIKEC4_TEST_GIT_ROOT ?? '', match[2])
const result = spawnSync('git', [match[1], repo], { stdio: 'inherit' })
process.exit(result.status ?? 128)
`

/**
 * Temporary folder with:
 * - a workspace (`<root>/workspace`)
 * - git repositories served by a fake `ssh` (`ssh://example.test/<name>.git`)
 * - the LikeC4 cache directory (`<root>/cache`)
 *
 * Returns the environment to stub (`vi.stubEnv`): isolated git configuration, the fake ssh, the cache directory.
 */
export function createGitDependencyFixture() {
  const root = mkdtempSync(join(tmpdir(), 'likec4-git-deps-'))
  const globalConfig = join(root, 'gitconfig')
  writeFileSync(globalConfig, '')
  const fakeSsh = join(root, 'fake-ssh.mjs')
  writeFileSync(fakeSsh, FAKE_SSH)
  const slash = (path: string) => path.replaceAll('\\', '/')

  const workspace = join(root, 'workspace')
  mkdirSync(workspace)
  const cacheDir = join(root, 'cache')

  const env: Record<string, string> = {
    GIT_CONFIG_GLOBAL: globalConfig,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_SSH_COMMAND: `"${slash(process.execPath)}" "${slash(fakeSsh)}"`,
    GIT_SSH_VARIANT: 'ssh',
    LIKEC4_TEST_GIT_ROOT: root,
    LIKEC4_CACHE_DIR: cacheDir,
  }
  const gitEnv = {
    ...process.env,
    ...env,
    GIT_AUTHOR_NAME: 'test',
    GIT_AUTHOR_EMAIL: 'test@example.test',
    GIT_COMMITTER_NAME: 'test',
    GIT_COMMITTER_EMAIL: 'test@example.test',
  }
  const git = (cwd: string, ...args: string[]) =>
    execFileSync('git', args, { cwd, env: gitEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

  /**
   * Creates a repository `ssh://example.test/<name>.git`
   */
  const repository = (name: string) => {
    const bare = join(root, `${name}.git`)
    const work = join(root, `${name}-work`)
    git(root, 'init', '--quiet', '--bare', '--initial-branch=main', bare)
    git(bare, 'config', 'uploadpack.allowFilter', 'true')
    git(root, 'init', '--quiet', '--initial-branch=main', work)
    return {
      url: `ssh://example.test/${name}.git`,
      /**
       * Path of the bare repository ("remote")
       */
      bare,
      /**
       * Writes files, commits and pushes to `main`. Returns the commit SHA.
       */
      commit(files: Record<string, string>) {
        for (const [path, content] of Object.entries(files)) {
          const file = join(work, path)
          mkdirSync(dirname(file), { recursive: true })
          writeFileSync(file, content)
        }
        git(work, 'add', '--all')
        git(work, 'commit', '--quiet', '--no-verify', '-m', 'commit')
        git(work, 'push', '--quiet', bare, 'main')
        return git(work, 'rev-parse', 'HEAD')
      },
    }
  }

  /**
   * Writes files of the workspace
   */
  const writeWorkspace = (files: Record<string, string>) => {
    for (const [path, content] of Object.entries(files)) {
      const file = join(workspace, path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, content)
    }
  }

  /**
   * Files in the cache directory (relative paths, recursive)
   */
  const cacheFiles = (): string[] => {
    try {
      return readdirSync(cacheDir, { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile())
        .map(entry => slash(join(entry.parentPath, entry.name)).slice(slash(cacheDir).length + 1))
        .sort()
    } catch {
      return []
    }
  }

  return {
    root,
    workspace,
    cacheDir,
    env,
    repository,
    writeWorkspace,
    cacheFiles,
    [Symbol.dispose]() {
      rmSync(root, { recursive: true, force: true })
    },
  }
}
