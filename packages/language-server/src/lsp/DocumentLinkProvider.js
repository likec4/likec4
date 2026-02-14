import { AstUtils, GrammarUtils } from 'langium';
import { hasLeadingSlash, hasProtocol, isRelative, joinRelativeURL, withoutBase, withoutLeadingSlash } from 'ufo';
import { ast, isLikeC4LangiumDocument } from '../ast';
import { logWarnError } from '../logger';
export class LikeC4DocumentLinkProvider {
    services;
    constructor(services) {
        this.services = services;
        //
    }
    async getDocumentLinks(doc, _params, _cancelToken) {
        if (!isLikeC4LangiumDocument(doc) || this.services.shared.workspace.ProjectsManager.isExcluded(doc)) {
            return [];
        }
        return AstUtils.streamAllContents(doc.parseResult.value)
            .filter(ast.isLinkProperty)
            .map((n) => {
            try {
                const range = GrammarUtils.findNodeForProperty(n.$cstNode, 'value')?.range;
                const target = range && this.resolveLink(doc, n.value);
                if (target && hasProtocol(target)) {
                    return {
                        range,
                        target,
                    };
                }
            }
            catch (e) {
                logWarnError(e);
            }
            return null;
        })
            .nonNullable()
            .toArray();
    }
    resolveLink(doc, link) {
        if (hasProtocol(link) || hasLeadingSlash(link)) {
            return link;
        }
        if (isRelative(link)) {
            return joinRelativeURL(doc.uri.toString(), '../', link);
        }
        const base = this.services.shared.workspace.ProjectsManager.getProject(doc).folderUri;
        return joinRelativeURL(base.toString(), link);
    }
    relativeLink(doc, link) {
        if (hasLeadingSlash(link)) {
            return withoutLeadingSlash(link);
        }
        if (isRelative(link)) {
            const base = this.services.shared.workspace.ProjectsManager.getProject(doc).folderUri.toString();
            const docURL = new URL(doc.uri.toString());
            const linkURL = new URL(link, docURL).toString();
            return withoutLeadingSlash(withoutBase(linkURL, base));
        }
        return null;
    }
}
