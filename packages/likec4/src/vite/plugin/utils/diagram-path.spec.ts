import type { DiagramView } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { addDocPaths } from './diagram-path'

const d = (id: string, path?: string): DiagramView =>
  ({
    id,
    ...(path && { docUri: `vscode-vfs://host/virtual/src/${path}` })
  }) as any

describe('addDocPaths', () => {
  it('should add docPath', () => {
    const result = addDocPaths([
      d('_1', 'file.c4'),
      d('_ab', 'a/b/file.c4'),
      d('_a', 'a/file.c4'),
      d('_2', 'file.c4'),
      d('_b', 'b/file.c4')
    ])
    expect(result).toMatchObject([
      { id: '_1', docPath: [] },
      { id: '_2', docPath: [] },
      { id: '_a', docPath: ['a'] },
      { id: '_b', docPath: ['b'] },
      { id: '_ab', docPath: ['a', 'b'] }
    ])
  })

  it('should ignore empty docUri', () => {
    const result = addDocPaths([d('virtual'), d('_a', 'a/file.c4'), d('_b', 'b/file.c4')])
    expect(result).toMatchObject([
      { id: 'virtual', docPath: [] },
      { id: '_a', docPath: ['a'] },
      { id: '_b', docPath: ['b'] }
    ])
  })
})
