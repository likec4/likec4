import { FqnRef } from '@likec4/core';
import { AstUtils } from 'langium';
import { ast } from '../ast';
import { logWarnError } from '../logger';
export class LikeC4DocumentationProvider {
    parser;
    locator;
    constructor(services) {
        this.parser = services.likec4.ModelParser;
        this.locator = services.likec4.ModelLocator;
    }
    getDocumentation(node) {
        try {
            if (ast.isDeploymentNode(node)) {
                const doc = AstUtils.getDocument(node);
                const el = this.parser.forDocument(doc).parseDeploymentNode(node);
                const lines = [el.id];
                if (el.title !== node.name) {
                    lines.push(' ', `**${el.title}**`);
                }
                return lines.join('  \n');
            }
            if (ast.isDeployedInstance(node)) {
                const doc = AstUtils.getDocument(node);
                const instance = this.parser.forDocument(doc).parseDeployedInstance(node);
                const [projectId, fqn] = FqnRef.isImportRef(instance.element)
                    ? [instance.element.project, instance.element.model]
                    : [doc.likec4ProjectId, instance.element.model];
                const el = projectId ? this.locator.getParsedElement(fqn, projectId) : this.locator.getParsedElement(fqn);
                const lines = [instance.id, `_instance of_ ${fqn}`];
                if (el) {
                    lines.push(' ', `**${el.title}**`);
                }
                return lines.join('  \n');
            }
            if (ast.isElement(node)) {
                const doc = AstUtils.getDocument(node);
                const el = this.parser.forDocument(doc).parseElement(node);
                if (!el) {
                    return;
                }
                const lines = [el.id, ' ', `**${el.title}**`];
                return lines.join('  \n');
            }
        }
        catch (e) {
            logWarnError(e);
        }
        return;
    }
}
