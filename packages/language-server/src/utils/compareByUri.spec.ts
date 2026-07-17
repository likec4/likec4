import { sort as remedaSort } from 'remeda'
import { describe, expect, it } from 'vitest'
import { URI } from 'vscode-uri'
import { compareByUri, compareByUriDeepFirst } from './compareByUri'

function file(path: string) {
  return { uri: URI.file(path) }
}

describe('compareByUri', () => {
  const sort = (array: Array<{ uri: URI }>) => remedaSort(array, compareByUri)

  it('should sort URIs hierarchically', () => {
    const withUri = [
      file('/b/c'),
      file('/b'),
      file('/a/b/c'),
    ]
    const sorted = sort(withUri)
    expect(sorted.map(x => x.uri.path)).toEqual([
      '/a/b/c',
      '/b',
      '/b/c',
    ])
  })

  it('should sort URIs with natural numeric ordering', () => {
    const withUri = [
      file('/a/b.10'),
      file('/a/b.2'),
      file('/a/b.1'),
    ]
    const sorted = sort(withUri)
    expect(sorted.map(x => x.uri.path)).toEqual([
      '/a/b.1',
      '/a/b.2',
      '/a/b.10',
    ])
  })

  it('should handle mixed path depths', () => {
    const withUri = [
      file('/b'),
      file('/a.b'),
      file('/a'),
      file('/a.b.c'),
      file('/a.a'),
    ]
    const sorted = sort(withUri)
    expect(sorted.map(x => x.uri.path)).toEqual([
      '/a',
      '/a.a',
      '/a.b',
      '/a.b.c',
      '/b',
    ])
  })

  it('should sort complex hierarchical paths', () => {
    const withUri = [
      file('/project/src/components/Button.tsx'),
      file('/project/src'),
      file('/project/src/components'),
      file('/project/src/utils/helpers.ts'),
      file('/project'),
    ]
    const sorted = sort(withUri)
    expect(sorted.map(x => x.uri.path)).toEqual([
      '/project',
      '/project/src',
      '/project/src/components',
      '/project/src/components/Button.tsx',
      '/project/src/utils/helpers.ts',
    ])
  })
})

describe('compareByUriDeepFirst', () => {
  const sort = (array: Array<{ uri: URI }>) => remedaSort(array, compareByUriDeepFirst)

  it('should sort URIs hierarchically', () => {
    const withUri = [
      file('/b/c'),
      file('/b'),
      file('/a/b/c'),
    ]
    const sorted = sort(withUri)
    expect(sorted.map(x => x.uri.path)).toEqual([
      '/a/b/c',
      '/b/c',
      '/b',
    ])
  })

  it('should sort URIs with natural numeric ordering', () => {
    const withUri = [
      file('/a/b.10'),
      file('/a/b.2'),
      file('/a/b.1'),
    ]
    const sorted = sort(withUri)
    expect(sorted.map(x => x.uri.path)).toEqual([
      '/a/b.1',
      '/a/b.2',
      '/a/b.10',
    ])
  })

  it('should sort complex hierarchical paths', () => {
    const withUri = [
      file('/project/src/components/Button.tsx'),
      file('/project/src'),
      file('/project/src/components'),
      file('/project/src/utils/helpers.ts'),
      file('/project'),
    ]
    const sorted = sort(withUri)
    expect(sorted.map(x => x.uri.path)).toEqual([
      '/project/src/components/Button.tsx',
      '/project/src/components',
      '/project/src/utils/helpers.ts',
      '/project/src',
      '/project',
    ])
  })
})
