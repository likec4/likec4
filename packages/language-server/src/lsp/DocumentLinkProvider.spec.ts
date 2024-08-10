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
    expect(services.shared.workspace.WorkspaceManager.workspaceUri.toString()).toBe(
      'vscode-vfs://host/virtual'
    )
    expect(services.shared.workspace.WorkspaceManager.workspaceURL.toString()).toBe(
      'vscode-vfs://host/virtual'
    )
    expect(doc.uri.toString()).toBe('vscode-vfs://host/virtual/src/dir1/doc.c4')
  })

  it('should return the link unchanged if it has a protocol', () => {
    const link = 'http://example.com/link'
    expect(documentLinkProvider.resolveLink(doc, link)).toBe(link)
  })

  it('should resolve a relative link against the document URI', () => {
    const link = './relative/link#fragment'
    const expected = 'vscode-vfs://host/virtual/src/dir1/relative/link#fragment'
    expect(documentLinkProvider.resolveLink(doc, link)).toBe(expected)
  })

  it('should resolve a parent relative link against the document URI', () => {
    const link = '../dir2/link?query=1#L1=22'
    const expected = 'vscode-vfs://host/virtual/src/dir2/link?query=1#L1=22'
    expect(documentLinkProvider.resolveLink(doc, link)).toBe(expected)
  })

  it('should resolve a link against the workspace URL', () => {
    const link = '/root'
    const expected = 'vscode-vfs://host/virtual/root'
    expect(documentLinkProvider.resolveLink(doc, link)).toBe(expected)
  })

  it('should resolve a link with quary and hash against the workspace URL', () => {
    const link = '/root/a/b/c/link?query=1#L1=22'
    const expected = 'vscode-vfs://host/virtual/root/a/b/c/link?query=1#L1=22'
    expect(documentLinkProvider.resolveLink(doc, link)).toBe(expected)
  })
})
