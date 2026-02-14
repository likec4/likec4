import { DocumentState } from 'langium';
import { isLikeC4LangiumDocument, ViewOps } from '../ast';
import { logger } from '../logger';
import { projectIdFrom } from '../utils';
export class LikeC4CodeLensProvider {
    services;
    constructor(services) {
        this.services = services;
    }
    async provideCodeLens(doc, _params, cancelToken) {
        if (!isLikeC4LangiumDocument(doc)) {
            return;
        }
        if (doc.state < DocumentState.Linked) {
            logger.debug(`Waiting for document ${doc.uri.path} to be Linked`);
            await this.services.shared.workspace.DocumentBuilder.waitUntil(DocumentState.Linked, doc.uri, cancelToken);
            logger.debug(`Document is linked`);
        }
        const views = doc.parseResult.value.views.flatMap(v => v.views);
        return views.flatMap(ast => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const viewId = ViewOps.readId(ast);
            const range = ast.$cstNode?.range;
            if (!range || !viewId) {
                return [];
            }
            const projectId = projectIdFrom(ast);
            return {
                range: {
                    start: range.start,
                    end: {
                        line: range.start.line,
                        character: range.start.character + 4,
                    },
                },
                command: {
                    command: 'likec4.open-preview',
                    arguments: [viewId, projectId],
                    title: 'open preview',
                },
            };
        });
    }
}
