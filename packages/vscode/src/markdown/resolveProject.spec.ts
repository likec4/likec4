import type { NonEmptyArray, ProjectId } from '@likec4/core/types'
import type { FetchProjects } from '@likec4/language-server/protocol'
import { describe, expect, it } from 'vitest'
import { documentDirOf, documentUriOf, fromRpcProjects, resolveProject } from './resolveProject.ts'

function rpcProject(id: string, folder: string, name = id): FetchProjects.Res['projects'][ProjectId] {
  return {
    folder,
    path: folder,
    config: { name },
    docs: [`${folder}/model.c4`] as NonEmptyArray<string>,
  }
}

describe('documentUriOf / documentDirOf', () => {
  it('extracts URI and parent directory from VS Code-like Uri objects and paths', () => {
    const doc = { scheme: 'file', authority: '', path: '/workspace/shop/docs/arch.md' }
    expect(documentUriOf(doc)).toBe('file:///workspace/shop/docs/arch.md')
    expect(documentDirOf(doc)).toEqual({
      scheme: 'file',
      authority: '',
      path: '/workspace/shop/docs',
    })
  })

  it('supports vscode-vfs web URIs and fsPath-only mocks', () => {
    const vfsDoc = { scheme: 'vscode-vfs', authority: 'github', path: '/org/repo/README.md' }
    expect(documentDirOf(vfsDoc)).toEqual({
      scheme: 'vscode-vfs',
      authority: 'github',
      path: '/org/repo',
    })

    const fsDoc = { fsPath: '/workspace/notes.md' }
    expect(documentDirOf(fsDoc)).toEqual({
      scheme: 'file',
      authority: '',
      path: '/workspace',
    })
  })
})

describe('resolveProject', () => {
  const multiProjects = fromRpcProjects({
    ['default' as ProjectId]: rpcProject('default', 'file:///ws', 'default'),
    ['shop' as ProjectId]: rpcProject('shop', 'file:///ws/shop', 'shop'),
    ['shop-sub' as ProjectId]: rpcProject('shop-sub', 'file:///ws/shop/services/cart', 'shop-sub'),
    ['billing' as ProjectId]: rpcProject('billing', 'file:///ws/billing', 'billing'),
  })

  it('resolves deepest matching non-default project before default', () => {
    expect(
      resolveProject(documentDirOf('file:///ws/shop/services/cart/README.md'), undefined, multiProjects),
    ).toMatchObject({
      ok: true,
      project: { id: 'shop-sub' },
    })

    expect(
      resolveProject(documentDirOf('file:///ws/shop/docs/overview.md'), undefined, multiProjects),
    ).toMatchObject({
      ok: true,
      project: { id: 'shop' },
    })

    expect(
      resolveProject(documentDirOf('file:///ws/other/notes.md'), undefined, multiProjects),
    ).toMatchObject({
      ok: true,
      project: { id: 'default' },
    })
  })

  it('resolves explicit project=<name> anywhere and reports unknown projects', () => {
    expect(
      resolveProject(documentDirOf('file:///ws/shop/README.md'), 'billing', multiProjects),
    ).toMatchObject({
      ok: true,
      project: { id: 'billing' },
    })

    expect(
      resolveProject({ scheme: 'untitled', authority: '', path: '/Untitled-1' }, 'shop', multiProjects),
    ).toMatchObject({
      ok: true,
      project: { id: 'shop' },
    })

    expect(
      resolveProject(documentDirOf('file:///ws/README.md'), 'missing', multiProjects),
    ).toEqual({
      ok: false,
      message: 'LikeC4 project "missing" not found.',
    })
  })

  it('uses single-project fallback for root READMEs and untitled docs', () => {
    const single = fromRpcProjects({
      ['shop' as ProjectId]: rpcProject('shop', 'file:///ws/packages/shop', 'shop'),
    })
    expect(
      resolveProject(documentDirOf('file:///ws/README.md'), undefined, single),
    ).toMatchObject({
      ok: true,
      project: { id: 'shop' },
    })
    expect(
      resolveProject({ scheme: 'untitled', authority: '', path: '/Untitled-1' }, undefined, single),
    ).toMatchObject({
      ok: true,
      project: { id: 'shop' },
    })
  })

  it('errors clearly when multiple projects exist outside docDir or no projects exist', () => {
    const twoProjects = fromRpcProjects({
      ['shop' as ProjectId]: rpcProject('shop', 'file:///ws/shop', 'shop'),
      ['billing' as ProjectId]: rpcProject('billing', 'file:///ws/billing', 'billing'),
    })
    expect(
      resolveProject(documentDirOf('file:///ws/README.md'), undefined, twoProjects),
    ).toEqual({
      ok: false,
      message: 'Multiple LikeC4 projects exist; specify project=<name> on this likec4-view block.',
    })
    expect(
      resolveProject(documentDirOf('file:///ws/README.md'), undefined, []),
    ).toEqual({
      ok: false,
      message: 'No LikeC4 project found for this Markdown file.',
    })
  })

  it('does not confuse sibling directories sharing a prefix', () => {
    const projects = fromRpcProjects({
      ['app' as ProjectId]: rpcProject('app', 'file:///ws/app', 'app'),
      ['app-v2' as ProjectId]: rpcProject('app-v2', 'file:///ws/app-v2', 'app-v2'),
    })
    expect(
      resolveProject(documentDirOf('file:///ws/app-v2/README.md'), undefined, projects),
    ).toMatchObject({
      ok: true,
      project: { id: 'app-v2' },
    })
  })

  it('normalizes Windows drive letter casing across file URIs', () => {
    const projects = fromRpcProjects({
      ['win' as ProjectId]: rpcProject('win', 'file:///C:/Repo/shop', 'win'),
    })
    expect(
      resolveProject(
        documentDirOf({ scheme: 'file', authority: '', path: '/c:/Repo/shop/docs/a.md' }),
        undefined,
        projects,
      ),
    ).toMatchObject({
      ok: true,
      project: { id: 'win' },
    })
  })
})
