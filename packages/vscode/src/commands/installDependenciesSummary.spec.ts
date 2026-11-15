import type { InstallDependencies } from '@likec4/language-server/protocol'
import { describe, expect, it } from 'vitest'
import { summarizeInstallResults } from './installDependenciesSummary'

type Result = InstallDependencies.Res['results'][number]

const instance = { repository: 'github.com/acme/billing', sha: 'a'.repeat(40), subdir: '' }

function result(name: string, value: Result['result']): Result {
  return { projectId: 'shop', name, result: value } as Result
}

describe('summarizeInstallResults', () => {
  it('reports a missing result as unsupported by the server', () => {
    expect(summarizeInstallResults(null, false)).toEqual({
      level: 'error',
      message: 'The LikeC4 language server does not support installing dependencies',
    })
    expect(summarizeInstallResults(undefined, true).level).toBe('error')
  })

  it('reports no git dependencies only for an empty result', () => {
    expect(summarizeInstallResults({ results: [] }, false)).toEqual({
      level: 'info',
      message: 'LikeC4: no git dependencies found',
    })
  })

  it('counts downloaded, cached, unsupported and failed results separately', () => {
    const res: InstallDependencies.Res = {
      results: [
        result('a', { status: 'installed', instance, files: 3, cached: false }),
        result('b', { status: 'installed', instance, files: 3, cached: true }),
        result('c', { status: 'unsupported' }),
        result('d', { status: 'failed', error: 'auth failed' }),
      ],
    }
    expect(summarizeInstallResults(res, false)).toEqual({
      level: 'warning',
      message:
        'LikeC4 git dependencies: 1 installed, 1 already installed, 1 not supported in this environment, 1 failed (shop/d: auth failed)',
    })
  })

  it('counts malformed entries and unknown statuses as failed', () => {
    const res = {
      results: [
        null,
        { projectId: 'shop', name: 'x' },
        { projectId: 'shop', name: 'y', result: { status: 'weird' } },
      ],
    } as unknown as InstallDependencies.Res
    expect(summarizeInstallResults(res, false)).toEqual({
      level: 'warning',
      message:
        'LikeC4 git dependencies: 0 installed, 3 failed (?/?: unexpected result; shop/x: unexpected result; shop/y: unexpected result)',
    })
  })

  it('reports cached results of an update as already up to date', () => {
    const res: InstallDependencies.Res = {
      results: [
        result('a', { status: 'installed', instance, files: 1, cached: false }),
        result('b', { status: 'installed', instance, files: 1, cached: true }),
      ],
    }
    expect(summarizeInstallResults(res, true)).toEqual({
      level: 'info',
      message: 'LikeC4 git dependencies: 1 updated, 1 already up to date',
    })
  })

  it('is info when everything is installed', () => {
    const res: InstallDependencies.Res = {
      results: [result('a', { status: 'installed', instance, files: 1, cached: false })],
    }
    expect(summarizeInstallResults(res, true)).toEqual({
      level: 'info',
      message: 'LikeC4 git dependencies: 1 updated',
    })
  })
})
