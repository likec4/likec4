import { URI } from 'langium'
import { describe, it } from 'vitest'
import {
  buildDependencyUri,
  isDependencyUri,
  isValidLocalDependencyFolder,
  localDependencyFolder,
  localDependencyUri,
  parseDependencyUri,
} from './dependency-uri'

describe('dependency-uri', () => {
  it('builds and parses URIs of local dependencies', ({ expect }) => {
    const uri = localDependencyUri(URI.parse('file:///work/shared'), URI.parse('file:///work/shared/views/index.c4'))
    expect(uri.toString()).toBe('likec4-dep://local/work/shared/-/views/index.c4')
    expect(isDependencyUri(uri)).toBe(true)
    expect(isDependencyUri(uri.toString())).toBe(true)
    expect(isDependencyUri('file:///work/shared/views/index.c4')).toBe(false)
    expect(parseDependencyUri(uri)).toEqual({ authority: 'local', instance: '/work/shared', path: 'views/index.c4' })
    expect(parseDependencyUri(uri.toString())).toEqual(parseDependencyUri(uri))
    expect(localDependencyFolder(uri)?.toString()).toBe('file:///work/shared')
  })

  it('accepts folders with trailing slash', ({ expect }) => {
    const uri = localDependencyUri(URI.parse('file:///work/shared/'), URI.parse('file:///work/shared/model.c4'))
    expect(uri.toString()).toBe('likec4-dep://local/work/shared/-/model.c4')
  })

  it('gives distinct URIs for the same file in nested folders', ({ expect }) => {
    const file = URI.parse('file:///deps/lib/sub/model.c4')
    const outer = localDependencyUri(URI.parse('file:///deps/lib'), file)
    const inner = localDependencyUri(URI.parse('file:///deps/lib/sub'), file)
    expect(outer.toString()).toBe('likec4-dep://local/deps/lib/-/sub/model.c4')
    expect(inner.toString()).toBe('likec4-dep://local/deps/lib/sub/-/model.c4')
    expect(localDependencyFolder(outer)?.toString()).toBe('file:///deps/lib')
    expect(localDependencyFolder(inner)?.toString()).toBe('file:///deps/lib/sub')
  })

  it('round-trips Windows drive paths', ({ expect }) => {
    for (
      const [folder, file] of [
        [URI.parse('file:///C:/work/shared'), URI.parse('file:///C:/work/shared/model.c4')],
        [URI.parse('file:///c%3A/work/shared'), URI.parse('file:///C%3A/work/shared/model.c4')],
        [URI.file('C:/work/shared'), URI.file('C:/work/shared/model.c4')],
      ] as const
    ) {
      const uri = localDependencyUri(folder, file)
      expect(uri.toString()).toBe('likec4-dep://local/c%3A/work/shared/-/model.c4')
      const parsed = URI.parse(uri.toString())
      expect(parseDependencyUri(parsed)).toEqual({ authority: 'local', instance: '/c:/work/shared', path: 'model.c4' })
      expect(localDependencyFolder(parsed)?.toString()).toBe('file:///c%3A/work/shared')
      expect(localDependencyFolder(parsed)?.toString()).toBe(URI.parse(folder.toString()).toString())
    }
    // upper case drive in the dependency URI resolves to the same folder
    expect(localDependencyFolder('likec4-dep://local/C:/work/shared/-/model.c4')?.toString())
      .toBe('file:///c%3A/work/shared')
  })

  it('round-trips special characters', ({ expect }) => {
    const folder = URI.file('/work/my deps/shared#1')
    const file = URI.file('/work/my deps/shared#1/views/a b.c4')
    const uri = localDependencyUri(folder, file)
    const parsed = parseDependencyUri(uri.toString())
    expect(parsed).toEqual({ authority: 'local', instance: '/work/my deps/shared#1', path: 'views/a b.c4' })
    expect(localDependencyFolder(uri.toString())?.toString()).toBe(folder.toString())
  })

  it('escapes "-" segments of the folder path', ({ expect }) => {
    const folder = URI.parse('file:///work/-/--/shared')
    const uri = localDependencyUri(folder, URI.parse('file:///work/-/--/shared/-/model.c4'))
    expect(uri.toString()).toBe('likec4-dep://local/work/--/---/shared/-/-/model.c4')
    expect(parseDependencyUri(uri.toString())).toEqual({
      authority: 'local',
      instance: '/work/-/--/shared',
      path: '-/model.c4',
    })
    expect(localDependencyFolder(uri)?.toString()).toBe('file:///work/-/--/shared')
  })

  it('keeps the format open for other authorities (git)', ({ expect }) => {
    const uri = buildDependencyUri({
      authority: 'github.com',
      instance: '/my-org/billing@0123abcd',
      path: 'architecture/model.c4',
    })
    expect(uri.toString()).toBe('likec4-dep://github.com/my-org/billing%400123abcd/-/architecture/model.c4')
    expect(parseDependencyUri(uri.toString())).toEqual({
      authority: 'github.com',
      instance: '/my-org/billing@0123abcd',
      path: 'architecture/model.c4',
    })
    // not a local dependency
    expect(localDependencyFolder(uri)).toBeUndefined()
  })

  it('rejects invalid URIs and folders', ({ expect }) => {
    expect(parseDependencyUri('likec4-dep://local/work/shared/model.c4')).toBeUndefined()
    expect(parseDependencyUri('likec4-dep://local/-/model.c4')).toBeUndefined()
    expect(parseDependencyUri('likec4-dep://local/work/shared/-/')).toBeUndefined()
    expect(parseDependencyUri('likec4-dep:///work/shared/-/model.c4')).toBeUndefined()
    expect(parseDependencyUri('file:///work/shared/-/model.c4')).toBeUndefined()

    expect(isValidLocalDependencyFolder(URI.parse('file:///work/shared'))).toBe(true)
    expect(isValidLocalDependencyFolder(URI.parse('file://server/share/shared'))).toBe(false)
    expect(isValidLocalDependencyFolder(URI.parse('vscode-vfs://github/org/repo'))).toBe(false)
    expect(() => localDependencyUri(URI.parse('file:///work/shared'), URI.parse('file:///work/other/m.c4')))
      .toThrow()
  })
})
