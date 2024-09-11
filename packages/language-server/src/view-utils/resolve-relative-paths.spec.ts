import type { ElementView } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { resolveRelativePaths } from './resolve-relative-paths'

const d = (id: string, path?: string): ElementView =>
  ({
    id,
    ...(path && { docUri: `vscode-vfs://host/virtual/src/${path}` })
  }) as any

describe('resolveRelativePaths', () => {
  it('should add relativePath', () => {
    const result = resolveRelativePaths([
      d('_1', 'file.c4'),
      d('_ab', 'a/b/file.c4'),
      d('_a', 'a/file.c4'),
      d('_10', 'file10.c4'),
      d('_2', 'file2.c4'),
      d('_3', 'file3.c4'),
      d('_a10', 'a/file.c4'),
      d('_a2', 'a/file.c4'),
      d('_b', 'b/file.c4')
    ])
    expect(result).toMatchObject([
      { id: '_1', relativePath: 'file.c4' },
      { id: '_2', relativePath: 'file2.c4' },
      { id: '_3', relativePath: 'file3.c4' },
      { id: '_10', relativePath: 'file10.c4' },
      { id: '_a', relativePath: 'a/file.c4' },
      { id: '_a2', relativePath: 'a/file.c4' },
      { id: '_a10', relativePath: 'a/file.c4' },
      { id: '_b', relativePath: 'b/file.c4' },
      { id: '_ab', relativePath: 'a/b/file.c4' }
    ])
  })

  it('should ignore empty docUri', () => {
    const result = resolveRelativePaths([
      d('virtual'),
      d('_a', 'a/file.c4'),
      d('_b', 'b/file.c4'),
      d('_bc', 'b/c/file.c4')
    ])
    expect(result).toMatchObject([
      { id: 'virtual', relativePath: '' },
      { id: '_a', relativePath: 'a/file.c4' },
      { id: '_b', relativePath: 'b/file.c4' },
      { id: '_bc', relativePath: 'b/c/file.c4' }
    ])
    // expect(result[0]!.relativePath).toBeUndefined()
  })
})
