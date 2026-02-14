import { beforeAll, describe, it } from 'vitest';
import { createMultiProjectTestServices, createTestServices } from '../test';
describe('DocumentLinkProvider', () => {
    describe('single project', () => {
        let services;
        let doc;
        let documentLinkProvider;
        beforeAll(async () => {
            const test = createTestServices({ workspace: 'vscode-vfs://host/virtual' });
            services = test.services;
            documentLinkProvider = services.lsp.DocumentLinkProvider;
            doc = await test.parse(`
      specification {
        element component
      }
    `, 'dir1/doc.c4');
        });
        it('test should have correct doc uri and workspace uri', ({ expect }) => {
            expect(services.shared.workspace.WorkspaceManager.workspaceURL.toString()).toBe('vscode-vfs://host/virtual');
            expect(doc.uri.toString()).toBe('vscode-vfs://host/virtual/src/dir1/doc.c4');
        });
        it('should return the link unchanged if it has a protocol', ({ expect }) => {
            const link = 'http://example.com/link';
            expect(documentLinkProvider.resolveLink(doc, link)).toBe(link);
            expect(documentLinkProvider.relativeLink(doc, link)).toBe(null);
        });
        it('should resolve a relative link against the document URI', ({ expect }) => {
            const link = './relative/link#fragment';
            expect(documentLinkProvider.resolveLink(doc, link))
                .toBe('vscode-vfs://host/virtual/src/dir1/relative/link#fragment');
            expect(documentLinkProvider.relativeLink(doc, link))
                .toBe('src/dir1/relative/link#fragment');
        });
        it('should resolve a parent relative link against the document URI', ({ expect }) => {
            const link = '../dir2/link?query=1#L1=22';
            expect(documentLinkProvider.resolveLink(doc, link))
                .toBe('vscode-vfs://host/virtual/src/dir2/link?query=1#L1=22');
            expect(documentLinkProvider.relativeLink(doc, link))
                .toBe('src/dir2/link?query=1#L1=22');
        });
        it('should keep link if has leading slash', ({ expect }) => {
            const link = '/root';
            expect(documentLinkProvider.resolveLink(doc, link)).toBe(link);
            expect(documentLinkProvider.relativeLink(doc, link)).toBe('root');
        });
        it('should keep link if has leading slash and relative after', ({ expect }) => {
            const link = '/../../root';
            expect(documentLinkProvider.resolveLink(doc, link)).toBe(link);
            expect(documentLinkProvider.relativeLink(doc, link)).toBe('../../root');
        });
        it('should keep a link with quary and hash if has leading slash', ({ expect }) => {
            const link = '/root/a/b/c/link?query=1#L1=22';
            expect(documentLinkProvider.resolveLink(doc, link)).toBe(link);
            expect(documentLinkProvider.relativeLink(doc, link)).toBe('root/a/b/c/link?query=1#L1=22');
        });
    });
    describe('multi project', () => {
        let services;
        let doc;
        let documentLinkProvider;
        beforeAll(async () => {
            const test = await createMultiProjectTestServices({
                project1: {
                    'dir1/doc1': `
          specification {
            element component
          }
        `,
                },
            });
            services = test.services;
            documentLinkProvider = services.lsp.DocumentLinkProvider;
            doc = test.projects.project1['dir1/doc1'];
        });
        it('test should have correct doc uri and workspace uri', ({ expect }) => {
            expect(services.shared.workspace.WorkspaceManager.workspaceURL.toString()).toBe('file:///test/workspace');
            expect(doc.uri.toString()).toBe('file:///test/workspace/src/project1/dir1/doc1.c4');
        });
        it('should return the link unchanged if it has a protocol', ({ expect }) => {
            const link = 'http://example.com/link';
            expect(documentLinkProvider.resolveLink(doc, link)).toBe(link);
            expect(documentLinkProvider.relativeLink(doc, link)).toBe(null);
        });
        it('should resolve a relative link against the document URI', ({ expect }) => {
            const link = './relative/link#fragment';
            expect(documentLinkProvider.resolveLink(doc, link))
                .toBe('file:///test/workspace/src/project1/dir1/relative/link#fragment');
            expect(documentLinkProvider.relativeLink(doc, link))
                .toBe('dir1/relative/link#fragment');
        });
        it('should resolve a parent relative link against the document URI', ({ expect }) => {
            const link = '../dir2/link?query=1#L1=22';
            expect(documentLinkProvider.resolveLink(doc, link))
                .toBe('file:///test/workspace/src/project1/dir2/link?query=1#L1=22');
            expect(documentLinkProvider.relativeLink(doc, link))
                .toBe('dir2/link?query=1#L1=22');
        });
        it('should keep link if has leading slash', ({ expect }) => {
            const link = '/root';
            expect(documentLinkProvider.resolveLink(doc, link)).toBe(link);
            expect(documentLinkProvider.relativeLink(doc, link)).toBe('root');
        });
        it('should keep link if has leading slash and relative after', ({ expect }) => {
            const link = '/../../root';
            expect(documentLinkProvider.resolveLink(doc, link)).toBe(link);
            expect(documentLinkProvider.relativeLink(doc, link)).toBe('../../root');
        });
        it('should keep a link with quary and hash if has leading slash', ({ expect }) => {
            const link = '/root/a/b/c/link?query=1#L1=22';
            expect(documentLinkProvider.resolveLink(doc, link)).toBe(link);
            expect(documentLinkProvider.relativeLink(doc, link)).toBe('root/a/b/c/link?query=1#L1=22');
        });
    });
});
