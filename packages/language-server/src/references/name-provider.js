import { nonNullable } from '@likec4/core';
import { DefaultNameProvider, isNamed } from 'langium';
import { ast } from '../ast';
export class LikeC4NameProvider extends DefaultNameProvider {
    services;
    constructor(services) {
        super();
        this.services = services;
    }
    getNameStrict(node) {
        return nonNullable(this.getName(node), `Failed getName for ${this.services.workspace.AstNodeLocator.getAstNodePath(node)}`);
    }
    getName(node) {
        if (isNamed(node)) {
            return node.name;
        }
        if (ast.isImported(node)) {
            return node.imported.$refText;
        }
        if (ast.isDeployedInstance(node)) {
            return node.target.modelElement.value.$refText;
        }
        return undefined;
    }
    getNameNode(node) {
        if (isNamed(node)) {
            return super.getNameNode(node);
        }
        if (ast.isImported(node)) {
            return node.imported.$refNode;
        }
        if (ast.isDeployedInstance(node)) {
            return node.target.modelElement.value.$refNode;
        }
        return undefined;
    }
}
