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
      d('_2', 'file2.c4'),
      d('_3', 'file3.c4'),
      d('_a2', 'a/file.c4'),
      d('_b', 'b/file.c4')
    ])
    expect(result).toMatchObject([
      { id: '_1', relativePath: '' },
      { id: '_2', relativePath: '' },
      { id: '_3', relativePath: '' },
      { id: '_a', relativePath: 'a' },
      { id: '_a2', relativePath: 'a' },
      { id: '_b', relativePath: 'b' },
      { id: '_ab', relativePath: 'a/b' }
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
      { id: 'virtual' },
      { id: '_a', relativePath: 'a' },
      { id: '_b', relativePath: 'b' },
      { id: '_bc', relativePath: 'b/c' }
    ])
    expect(result[0]!.relativePath).toBeUndefined()
  })
})
