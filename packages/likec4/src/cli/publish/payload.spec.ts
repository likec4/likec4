import type { LayoutedLikeC4ModelData } from '@likec4/core'
import { ProjectId } from '@likec4/core'
import { join, posix, resolve, win32 } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { GitProvenance } from './git'
import { buildPublishPayload, toWorkspacePath } from './payload'

const provenance: GitProvenance = {
  origin: 'likec4/likec4',
  sha: 'abc123',
  branch: 'main',
  tag: 'v1.0.0',
  commit: {
    message: 'feat: publish',
    author: 'Alice Smith',
    email: 'alice@example.com',
    date: '2026-07-31T10:34:56.000Z',
  },
  root: '/repo',
  dirty: false,
}

function modelData(name: string): LayoutedLikeC4ModelData {
  const projectId = ProjectId(name)
  return {
    _stage: 'layouted',
    projectId,
    project: { id: projectId, title: name },
    specification: {
      tags: {},
      elements: {},
      deployments: {},
      relationships: {},
    },
    elements: {},
    deployments: { elements: {}, relations: {} },
    relations: {},
    globals: { predicates: {}, dynamicPredicates: {}, styles: {} },
    imports: {},
    views: {},
  }
}

// Path semantics are injected, never mocked: `posix` and `win32` make every case below
// deterministic on any host and independent of what else is in the vitest run.
describe('toWorkspacePath with POSIX paths', () => {
  it('maps a project at the git root to "."', () => {
    expect(toWorkspacePath('/repo', '/repo', posix)).toBe('.')
    expect(toWorkspacePath('/repo', '/repo/', posix)).toBe('.')
  })

  it('maps nested folders to a relative path', () => {
    expect(toWorkspacePath('/repo', '/repo/src', posix)).toBe('src')
    expect(toWorkspacePath('/repo', '/repo/packages/app/likec4', posix)).toBe('packages/app/likec4')
  })

  it.each([
    ['/repo', '/outside/project'],
    ['/repo', '/repo-sibling/project'],
    ['/repo/packages', '/repo'],
  ])('throws when the project folder %s / %s is outside the git root', (root, folder) => {
    expect(() => toWorkspacePath(root, folder, posix)).toThrow(/outside the git root/)
  })
})

describe('toWorkspacePath with Windows paths', () => {
  it('converts the backslashes returned by relative() to POSIX separators', () => {
    // win32.relative() returns 'packages\\app' — the endpoint key must be 'packages/app'
    expect(win32.relative('C:\\repo', 'C:\\repo\\packages\\app')).toBe('packages\\app')
    expect(toWorkspacePath('C:\\repo', 'C:\\repo\\packages\\app', win32)).toBe('packages/app')
  })

  it('maps a project at the git root to "."', () => {
    expect(toWorkspacePath('C:\\repo', 'C:\\repo', win32)).toBe('.')
  })

  it('throws for a folder on the same drive but outside the git root', () => {
    expect(() => toWorkspacePath('C:\\repo', 'C:\\other\\project', win32)).toThrow(/outside the git root/)
  })

  it.each([
    ['C:\\repo', 'D:\\other\\project'],
    ['\\\\srv\\share\\repo', 'C:\\other\\project'],
  ])('throws for %s / %s, where relative() returns an absolute path', (root, folder) => {
    // no shared root: win32.relative() returns the target verbatim, so there is no '..' prefix
    expect(win32.relative(root, folder)).toBe(folder)
    expect(() => toWorkspacePath(root, folder, win32)).toThrow(/outside the git root/)
  })
})

describe('toWorkspacePath with the default (host) path semantics', () => {
  // paths are built with the host's own helpers, so these hold on POSIX and Windows alike
  const root = resolve('repo')

  it('maps a project at the git root to "."', () => {
    expect(toWorkspacePath(root, root)).toBe('.')
  })

  it('always emits POSIX separators, whatever the host uses', () => {
    expect(toWorkspacePath(root, join(root, 'packages', 'app'))).toBe('packages/app')
  })

  it('throws for a folder outside the git root', () => {
    expect(() => toWorkspacePath(root, resolve('other-repo'))).toThrow(/outside the git root/)
  })
})

describe('buildPublishPayload', () => {
  it('builds the request body keyed by workspace path', () => {
    const root = modelData('root')
    const nested = modelData('nested')

    const payload = buildPublishPayload({
      provenance,
      projects: [
        { name: 'root', folder: '/repo', data: root },
        { name: 'nested', folder: '/repo/packages/app', data: nested },
      ],
    })

    expect(payload).toEqual({
      origin: 'likec4/likec4',
      branch: 'main',
      tag: 'v1.0.0',
      sha: 'abc123',
      commit: provenance.commit,
      projects: {
        '.': root,
        'packages/app': nested,
      },
    })
    expect(payload.projects['.']).toBe(root)
  })

  it('keeps null branch and tag', () => {
    const payload = buildPublishPayload({
      provenance: { ...provenance, branch: null, tag: null },
      projects: [{ name: 'root', folder: '/repo', data: modelData('root') }],
    })

    expect(payload.branch).toBeNull()
    expect(payload.tag).toBeNull()
  })

  it('produces an empty record for no projects', () => {
    expect(buildPublishPayload({ provenance, projects: [] }).projects).toEqual({})
  })

  it('throws naming both projects when two resolve to the same workspace path', () => {
    expect(() =>
      buildPublishPayload({
        provenance,
        projects: [
          { name: 'alpha', folder: '/repo/packages/app', data: modelData('alpha') },
          { name: 'beta', folder: '/repo/packages/app/', data: modelData('beta') },
        ],
      })
    ).toThrow(/"alpha".*"beta".*"packages\/app"/s)
  })

  it('throws when a project folder is outside the git root', () => {
    expect(() =>
      buildPublishPayload({
        provenance,
        projects: [{ name: 'outside', folder: '/elsewhere/project', data: modelData('outside') }],
      })
    ).toThrow(/outside the git root/)
  })
})
