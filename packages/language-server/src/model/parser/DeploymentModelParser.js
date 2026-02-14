import { exact, FqnRef, invariant, LinkedList, nameFromFqn, nonexhaustive, nonNullable, } from '@likec4/core';
import { filter, first, isDefined, isEmpty, isTruthy, mapToObj, pipe } from 'remeda';
import { ast, toRelationshipStyle, } from '../../ast';
import { stringHash } from '../../utils/stringHash';
function* streamDeploymentModel(doc) {
    const traverseStack = LinkedList.from(doc.parseResult.value.deployments.flatMap(m => m.elements));
    const relations = [];
    let el;
    while ((el = traverseStack.shift())) {
        if (ast.isDeploymentRelation(el)) {
            relations.push(el);
            continue;
        }
        if (el.body && el.body.elements.length > 0) {
            for (const child of el.body.elements) {
                traverseStack.push(child);
            }
        }
        yield el;
    }
    yield* relations;
    return;
}
export function DeploymentModelParser(B) {
    return class DeploymentModelParser extends B {
        parseDeployment() {
            const doc = this.doc;
            for (const el of streamDeploymentModel(doc)) {
                try {
                    switch (true) {
                        case ast.isDeploymentRelation(el): {
                            if (this.isValid(el)) {
                                doc.c4DeploymentRelations.push(this.parseDeploymentRelation(el));
                            }
                            break;
                        }
                        case ast.isDeployedInstance(el):
                            doc.c4Deployments.push(this.parseDeployedInstance(el));
                            break;
                        case ast.isDeploymentNode(el): {
                            doc.c4Deployments.push(this.parseDeploymentNode(el));
                            break;
                        }
                        case ast.isExtendDeployment(el): {
                            const parsed = this.parseExtendDeployment(el);
                            if (parsed) {
                                doc.c4ExtendDeployments.push(parsed);
                            }
                            break;
                        }
                        default:
                            nonexhaustive(el);
                    }
                }
                catch (e) {
                    this.logError(e, el, 'deployment');
                }
            }
        }
        parseDeploymentNode(astNode) {
            const isValid = this.isValid;
            const id = this.resolveFqn(astNode);
            const kind = nonNullable(astNode.kind.ref, 'DeploymentKind not resolved').name;
            const tags = this.parseTags(astNode.body) ?? undefined;
            const links = this.parseLinks(astNode.body);
            const style = this.parseElementStyle(astNode.body?.props);
            const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty));
            const bodyProps = pipe(astNode.body?.props ?? [], filter(isValid), filter(ast.isElementStringProperty), mapToObj(p => [p.key, p.value]));
            const { title, ...descAndTech } = this.parseBaseProps(bodyProps, {
                title: astNode.title,
                summary: astNode.summary,
            });
            return exact({
                id,
                kind,
                title: title ?? nameFromFqn(id),
                ...descAndTech,
                tags,
                links,
                style,
                metadata,
            });
        }
        parseDeployedInstance(astNode) {
            const isValid = this.isValid;
            const id = this.resolveFqn(astNode);
            const target = this.parseFqnRef(astNode.target.modelElement);
            invariant(FqnRef.isModelRef(target) || FqnRef.isImportRef(target), 'Target must be a model reference');
            // const element = FqnRef.toModelFqn(target)
            const tags = this.parseTags(astNode.body) ?? undefined;
            const style = this.parseElementStyle(astNode.body?.props);
            const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty));
            const bodyProps = pipe(astNode.body?.props ?? [], filter(isValid), filter(ast.isElementStringProperty), mapToObj(p => [p.key, p.value]));
            const baseProps = this.parseBaseProps(bodyProps, {
                title: astNode.title,
                summary: astNode.summary,
            });
            const links = this.parseLinks(astNode.body);
            return exact({
                id,
                element: target,
                tags,
                links,
                ...baseProps,
                style,
                metadata,
            });
        }
        parseExtendDeployment(astNode) {
            const tags = this.parseTags(astNode.body);
            const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty));
            const links = this.parseLinks(astNode.body);
            if (!tags && isEmpty(metadata ?? {}) && !links) {
                return null;
            }
            const id = this.resolveFqn(astNode);
            const astPath = this.getAstNodePath(astNode);
            return exact({
                id,
                astPath,
                metadata,
                tags,
                links,
            });
        }
        _resolveDeploymentRelationSource(node) {
            if (isDefined(node.source)) {
                return this.parseFqnRef(node.source);
            }
            if (node.$container.$type === 'DeploymentNodeBody' || node.$container.$type === 'DeployedInstanceBody') {
                return {
                    deployment: this.resolveFqn(node.$container.$container),
                };
            }
            throw new Error('RelationRefError: Invalid container for sourceless relation');
        }
        parseDeploymentRelation(astNode) {
            const isValid = this.isValid;
            const astPath = this.getAstNodePath(astNode);
            const source = this._resolveDeploymentRelationSource(astNode);
            invariant(FqnRef.isDeploymentRef(source), 'Invalid source for deployment relation');
            const target = this.parseFqnRef(astNode.target);
            invariant(FqnRef.isDeploymentRef(target), 'Invalid target for deployment relation');
            const tags = this.convertTags(astNode) ?? this.convertTags(astNode.body) ?? undefined;
            const links = this.convertLinks(astNode.body);
            const kind = (astNode.kind ?? astNode.dotKind?.kind)?.ref?.name;
            const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty));
            const bodyProps = pipe(astNode.body?.props ?? [], filter(ast.isRelationStringProperty), filter(p => isTruthy(p.value)), mapToObj(p => [p.key, p.value]));
            const navigateTo = pipe(astNode.body?.props ?? [], filter(ast.isRelationNavigateToProperty), first())?.value.view.ref?.name;
            const titleDescAndTech = this.parseBaseProps(bodyProps, {
                title: astNode.title,
            });
            const styleProp = astNode.body?.props.find(ast.isRelationStyleProperty);
            const id = stringHash('deployment', astPath, source.deployment, target.deployment);
            return exact({
                id,
                source,
                target,
                ...titleDescAndTech,
                metadata,
                kind,
                tags,
                links,
                ...toRelationshipStyle(styleProp?.props, isValid),
                navigateTo,
                astPath,
            });
        }
    };
}
