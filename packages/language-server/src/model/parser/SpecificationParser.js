import * as c4 from '@likec4/core';
import { exact } from '@likec4/core';
import { nonNullable } from '@likec4/core/utils';
import { filter, isNonNullish, isNullish, isTruthy, mapToObj, omitBy, pipe } from 'remeda';
import { ast, parseMarkdownAsString, toRelationshipStyle } from '../../ast';
import { removeIndent } from './Base';
export function SpecificationParser(B) {
    return class SpecificationParser extends B {
        parseSpecification() {
            const { parseResult: { value: { specifications, }, }, c4Specification, } = this.doc;
            const isValid = this.isValid;
            for (const elementSpec of specifications.flatMap(s => s.elements.filter(isValid))) {
                try {
                    Object.assign(c4Specification.elements, this.parseElementSpecificationNode(elementSpec));
                }
                catch (e) {
                    this.logError(e, elementSpec, 'specification');
                }
            }
            for (const deploymentNodeSpec of specifications.flatMap(s => s.deploymentNodes.filter(isValid))) {
                try {
                    Object.assign(c4Specification.deployments, this.parseElementSpecificationNode(deploymentNodeSpec));
                }
                catch (e) {
                    this.logError(e, deploymentNodeSpec, 'specification');
                }
            }
            const relations_specs = specifications.flatMap(s => s.relationships.filter(this.isValid));
            for (const { kind, props } of relations_specs) {
                try {
                    const kindName = kind.name;
                    if (!isTruthy(kindName)) {
                        continue;
                    }
                    if (kindName in c4Specification.relationships) {
                        this.logError(`Relationship kind "${kindName}" is already defined`, kind, 'specification');
                        continue;
                    }
                    const bodyProps = pipe(props.filter(ast.isSpecificationRelationshipStringProperty) ?? [], filter(p => this.isValid(p) && isNonNullish(p.value)), mapToObj(p => [p.key, removeIndent(parseMarkdownAsString(p.value))]), omitBy(isNullish));
                    c4Specification.relationships[kindName] = {
                        ...bodyProps,
                        ...toRelationshipStyle(props.filter(ast.isRelationshipStyleProperty), this.isValid),
                    };
                }
                catch (e) {
                    this.logError(e, kind, 'specification');
                }
            }
            const tags_specs = specifications.flatMap(s => s.tags.filter(this.isValid));
            for (const tagSpec of tags_specs) {
                try {
                    const tag = tagSpec.tag.name;
                    const astPath = this.getAstNodePath(tagSpec.tag);
                    const color = tagSpec.color && this.parseColorLiteral(tagSpec.color);
                    if (tag in c4Specification.tags) {
                        this.logError(`Tag ${tag} is already defined, skipping duplicate`, tagSpec, 'specification');
                        continue;
                    }
                    if (isTruthy(tag)) {
                        c4Specification.tags[tag] = {
                            astPath,
                            ...(color ? { color } : {}),
                        };
                    }
                }
                catch (e) {
                    this.logError(e, tagSpec, 'specification');
                }
            }
            const colors_specs = specifications.flatMap(s => s.colors.filter(isValid));
            for (const { name, color } of colors_specs) {
                try {
                    const colorName = name.name;
                    if (colorName in c4Specification.colors) {
                        this.logError(`Custom color "${colorName}" is already defined`, name, 'specification');
                        continue;
                    }
                    c4Specification.colors[colorName] = {
                        color: nonNullable(this.parseColorLiteral(color), `Color "${colorName}" is not valid`),
                    };
                }
                catch (e) {
                    this.logError(e, color, 'specification');
                }
            }
        }
        parseElementSpecificationNode(specAst) {
            const { kind, props } = specAst;
            const kindName = kind.name;
            if (!isTruthy(kindName)) {
                throw new Error('DeploymentNodeKind name is not resolved');
            }
            const tags = this.parseTags(specAst);
            const style = this.parseElementStyle(props.find(ast.isElementStyleProperty));
            const links = this.parseLinks(specAst);
            const bodyProps = pipe(props.filter(ast.isSpecificationElementStringProperty) ?? [], filter(p => this.isValid(p)), mapToObj(p => [p.key, p.value]));
            const baseProps = this.parseBaseProps(bodyProps);
            const notation = removeIndent(parseMarkdownAsString(bodyProps.notation));
            return {
                [kindName]: exact({
                    ...baseProps,
                    notation,
                    tags: tags ?? undefined,
                    ...(links && c4.isNonEmptyArray(links) && { links }),
                    style,
                }),
            };
        }
    };
}
