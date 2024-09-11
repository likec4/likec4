import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { LikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import { createTestServices } from '../test'
import type { LikeC4DocumentLinkProvider } from './DocumentLinkProvider'

describe('DocumentLinkProvider', () => {
  let services: LikeC4Services
  let doc: LikeC4LangiumDocument
  let documentLinkProvider: LikeC4DocumentLinkProvider

  beforeAll(async () => {
    const test = createTestServices('vscode-vfs://host/virtual')
    services = test.services
    documentLinkProvider = services.lsp.DocumentLinkProvider
    doc = await test.parse(
      `
      specification {
        element component
      }
    `,
      'dir1/doc.c4'
    )
  })

  it('test should have correct doc uri and workspace uri', () => {
    expect(services.shared.workspace.WorkspaceManager.workspaceURL.toString()).toBe(
      'vscode-vfs://host/virtual'
    )
    expect(doc.uri.toString()).toBe('vscode-vfs://host/virtual/src/dir1/doc.c4')
  })

  it('should return the link unchanged if it has a protocol', () => {
    const link = 'http://example.com/link'
    expect(documentLinkProvider.resolveLink(doc, link)).toBe(link)
    expect(documentLinkProvider.relativeLink(doc, link)).toBe(null)
  })

  it('should resolve a relative link against the document URI', () => {
    const link = './relative/link#fragment'
    expect(documentLinkProvider.resolveLink(doc, link))
      .toBe('vscode-vfs://host/virtual/src/dir1/relative/link#fragment')
    expect(documentLinkProvider.relativeLink(doc, link))
      .toBe('src/dir1/relative/link#fragment')
  })

  it('should resolve a parent relative link against the document URI', () => {
    const link = '../dir2/link?query=1#L1=22'
    expect(documentLinkProvider.resolveLink(doc, link))
      .toBe('vscode-vfs://host/virtual/src/dir2/link?query=1#L1=22')
    expect(documentLinkProvider.relativeLink(doc, link))
      .toBe('src/dir2/link?query=1#L1=22')
  })

  it('should keep link if has leading slash', () => {
    const link = '/root'
    expect(documentLinkProvider.resolveLink(doc, link)).toBe(link)
    expect(documentLinkProvider.relativeLink(doc, link)).toBe('root')
  })
  it('should keep link if has leading slash and relative after', () => {
    const link = '/../../root'
    expect(documentLinkProvider.resolveLink(doc, link)).toBe(link)
    expect(documentLinkProvider.relativeLink(doc, link)).toBe('../../root')
  })

  it('should keep a link with quary and hash if has leading slash', () => {
    const link = '/root/a/b/c/link?query=1#L1=22'
    expect(documentLinkProvider.resolveLink(doc, link)).toBe(link)
    expect(documentLinkProvider.relativeLink(doc, link)).toBe('root/a/b/c/link?query=1#L1=22')
  })
})
