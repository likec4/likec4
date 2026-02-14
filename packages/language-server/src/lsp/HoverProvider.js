import { FqnRef, preferSummary } from '@likec4/core';
import { AstUtils } from 'langium';
import { AstNodeHoverProvider } from 'langium/lsp';
import { ast } from '../ast';
export class LikeC4HoverProvider extends AstNodeHoverProvider {
    parser;
    locator;
    constructor(services) {
        super(services);
        this.parser = services.likec4.ModelParser;
        this.locator = services.likec4.ModelLocator;
    }
    getAstNodeHoverContent(node) {
        if (ast.isTag(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: 'tag `' + node.name + '`',
                },
            };
        }
        if (ast.isDeploymentNode(node)) {
            const doc = AstUtils.getDocument(node);
            const el = this.parser.forDocument(doc).parseDeploymentNode(node);
            const lines = [el.id + '  '];
            if (el.title !== node.name) {
                lines.push(`### ${el.title}`);
            }
            lines.push('deployment node `' + el.kind + '` ');
            const summary = preferSummary(el);
            if (summary) {
                lines.push('', summary.md ?? summary.txt);
            }
            return {
                contents: {
                    kind: 'markdown',
                    value: lines.join('\n'),
                },
            };
        }
        if (ast.isDeployedInstance(node)) {
            const doc = AstUtils.getDocument(node);
            const instance = this.parser.forDocument(doc).parseDeployedInstance(node);
            const [projectId, fqn] = FqnRef.isImportRef(instance.element)
                ? [instance.element.project, instance.element.model]
                : [doc.likec4ProjectId, instance.element.model];
            const el = projectId ? this.locator.getParsedElement(fqn, projectId) : this.locator.getParsedElement(fqn);
            const lines = [instance.id + '  ', `instance of \`${FqnRef.flatten(instance.element)}\``];
            if (el) {
                lines.push(`### ${el.title}`, 'element kind `' + el.kind + '` ');
            }
            return {
                contents: {
                    kind: 'markdown',
                    value: lines.join('\n'),
                },
            };
        }
        if (ast.isElementKind(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: 'element kind `' + node.name + '`',
                },
            };
        }
        if (ast.isDeploymentNodeKind(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: 'deployment node `' + node.name + '`',
                },
            };
        }
        if (ast.isRelationshipKind(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: 'relationship kind `' + node.name + '`',
                },
            };
        }
        if (ast.isElement(node)) {
            const el = this.locator.getParsedElement(node);
            if (!el) {
                return;
            }
            const lines = [
                el.id,
                `### ${el.title}`,
                'element kind `' + el.kind + '` ',
            ];
            const summary = preferSummary(el);
            if (summary) {
                lines.push('', summary.md ?? summary.txt);
            }
            return {
                contents: {
                    kind: 'markdown',
                    value: lines.join('\n'),
                },
            };
        }
        return;
    }
}
