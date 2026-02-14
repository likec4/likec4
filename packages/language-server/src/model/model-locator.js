import { splitGlobalFqn } from '@likec4/core';
import { ifilter, invariant, toArray } from '@likec4/core/utils';
import { loggable } from '@likec4/log';
import { AstUtils, DocumentState, GrammarUtils } from 'langium';
import { flatMap, isString, pipe } from 'remeda';
import { ast, isLikeC4LangiumDocument } from '../ast';
import { logger as serverLogger } from '../logger';
import { projectIdFrom } from '../utils';
import { MergedSpecification } from './builder/MergedSpecification';
const { findNodeForKeyword, findNodeForProperty } = GrammarUtils;
const { getDocument, streamAllContents } = AstUtils;
const logger = serverLogger.getChild('locator');
export class LikeC4ModelLocator {
    services;
    fqnIndex;
    deploymentsIndex;
    langiumDocuments;
    parser;
    projects;
    constructor(services) {
        this.services = services;
        this.fqnIndex = services.likec4.FqnIndex;
        this.deploymentsIndex = services.likec4.DeploymentsIndex;
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
        this.parser = services.likec4.ModelParser;
        this.projects = services.shared.workspace.ProjectsManager;
    }
    documents(projectId) {
        return this.parser.documents(projectId);
    }
    // public getParsedElement(astNodeOrFqn: ast.Element): ParsedAstElement | null
    // public getParsedElement(astNodeOrFqn: c4.Fqn, projectId?: c4.ProjectId): ParsedAstElement | null
    getParsedElement(...args) {
        let astNodeOrFqn;
        let projectId;
        if (args.length === 2) {
            astNodeOrFqn = args[0];
            projectId = args[1];
        }
        else {
            astNodeOrFqn = args[0];
            projectId = isString(astNodeOrFqn) ? this.projects.ensureProjectId() : projectIdFrom(astNodeOrFqn);
        }
        if (isString(astNodeOrFqn)) {
            const fqn = astNodeOrFqn;
            const entry = this.fqnIndex.byFqn(projectId, fqn).head();
            if (!entry) {
                return null;
            }
            const doc = this.langiumDocuments.getDocument(entry.documentUri);
            if (!doc) {
                return null;
            }
            return this.parser.parse(doc).c4Elements.find(e => e.id === fqn) ?? null;
        }
        const fqn = this.fqnIndex.getFqn(astNodeOrFqn);
        const doc = this.parser.parse(getDocument(astNodeOrFqn));
        return doc.c4Elements.find(e => e.id === fqn) ?? null;
    }
    locateElement(fqn, projectId) {
        let [_projectId, _fqn] = splitGlobalFqn(fqn);
        _projectId ??= this.projects.ensureProjectId(projectId);
        const entry = this.fqnIndex.byFqn(_projectId, _fqn).head();
        const docsegment = entry?.nameSegment ?? entry?.selectionSegment;
        if (!entry || !docsegment) {
            return null;
        }
        return {
            uri: entry.documentUri.toString(),
            range: docsegment.range,
        };
    }
    locateDeploymentElement(deploymentFqn, projectId) {
        // let [_projectId, _fqn] = splitGlobalFqn(fqn)
        const _projectId = this.projects.ensureProjectId(projectId);
        // TODO: remove this cast to Fqn
        const fqn = deploymentFqn;
        const entry = this.deploymentsIndex.byFqn(_projectId, fqn).head();
        const docsegment = entry?.nameSegment ?? entry?.selectionSegment;
        if (!entry || !docsegment) {
            return null;
        }
        return {
            uri: entry.documentUri.toString(),
            range: docsegment.range,
        };
    }
    locateRelation(relationId, projectId) {
        const project = this.projects.ensureProjectId(projectId);
        for (const doc of this.documents(project)) {
            const relation = doc.c4Relations.find(r => r.id === relationId)
                ?? doc.c4DeploymentRelations.find(r => r.id === relationId);
            if (!relation) {
                continue;
            }
            const node = this.services.workspace.AstNodeLocator.getAstNode(doc.parseResult.value, relation.astPath);
            if (!ast.isRelation(node) && !ast.isDeploymentRelation(node)) {
                continue;
            }
            let targetNode = node.kind ? findNodeForProperty(node.$cstNode, 'kind') : undefined;
            targetNode ??= node.dotKind ? findNodeForProperty(node.$cstNode, 'dotKind') : undefined;
            targetNode ??= findNodeForKeyword(node.$cstNode, '->');
            targetNode ??= findNodeForProperty(node.$cstNode, 'title');
            targetNode ??= findNodeForProperty(node.$cstNode, 'target');
            targetNode ??= node.$cstNode;
            if (!targetNode) {
                continue;
            }
            return {
                uri: doc.uri.toString(),
                range: {
                    start: targetNode.range.start,
                    end: targetNode.range.start,
                },
            };
        }
        return null;
    }
    locateViewAst(viewId, projectId) {
        const project = this.projects.ensureProjectId(projectId);
        for (const doc of this.documents(project)) {
            const view = doc.c4Views.find(r => r.id === viewId);
            if (!view) {
                continue;
            }
            const viewAst = this.services.workspace.AstNodeLocator.getAstNode(doc.parseResult.value, view.astPath);
            if (ast.isLikeC4View(viewAst)) {
                return {
                    doc,
                    view,
                    viewAst,
                };
            }
        }
        return null;
    }
    locateView(viewId, projectId) {
        const res = this.locateViewAst(viewId, projectId);
        if (!res) {
            return null;
        }
        const node = res.viewAst;
        let targetNode = node.name ? findNodeForProperty(node.$cstNode, 'name') : undefined;
        targetNode ??= findNodeForKeyword(node.$cstNode, 'view');
        targetNode ??= node.$cstNode;
        if (!targetNode) {
            return null;
        }
        return {
            uri: res.doc.uri.toString(),
            range: {
                start: targetNode.range.start,
                end: targetNode.range.start,
            },
        };
    }
    async locateDocumentTags(documentUri, cancelToken) {
        const doc = this.langiumDocuments.getDocument(documentUri);
        if (!doc || !isLikeC4LangiumDocument(doc)) {
            return [];
        }
        if (doc.state < DocumentState.Validated) {
            logger.debug(`Waiting for document ${doc.uri.path} to be Validated`);
            await this.services.shared.workspace.DocumentBuilder.waitUntil(DocumentState.Validated, doc.uri, cancelToken);
        }
        const projectId = projectIdFrom(doc);
        logger.debug(`locate document tags for ${doc.uri.path} in project ${projectId}`);
        try {
            const tagSpecs = new MergedSpecification(this.documents(projectId).toArray()).tags;
            logger.debug(`Assigned colors to tags`, { tagSpecs });
            const tags = pipe(streamAllContents(doc.parseResult.value), ifilter(astNode => ast.isTag(astNode) || ast.isTagRef(astNode)), toArray(), flatMap(tagRef => {
                let name;
                let $cstNode;
                try {
                    if (ast.isTag(tagRef)) {
                        name = tagRef.name;
                        $cstNode = tagRef.$cstNode;
                    }
                    else {
                        name = tagRef.tag.$refText;
                        $cstNode = tagRef.tag.$refNode;
                    }
                    const specification = tagSpecs[name];
                    invariant(specification, `Tag ${name} not found in merged specification`);
                    invariant($cstNode, `Tag ${name} does not have a $cstNode`);
                    return {
                        name,
                        color: specification.color,
                        range: $cstNode.range,
                        isSpecification: ast.isTag(tagRef),
                    };
                }
                catch (err) {
                    logger.warn(`Fail on tag ${name}`, { err });
                    return [];
                }
            }));
            logger.debug(`Found ${tags.length} tags in document ${doc.uri.path}`);
            return tags;
        }
        catch (e) {
            logger.warn(loggable(e));
            return [];
        }
    }
    locateDynamicViewStep(params) {
        const { doc, viewAst } = this.locateViewAst(params.view, params.projectId) ?? {};
        if (!doc || !viewAst) {
            return null;
        }
        if (!ast.isDynamicView(viewAst) || !viewAst.body) {
            logger.warn(`View ${params.view} is not a dynamic view`);
            return null;
        }
        const astPath = this.services.workspace.AstNodeLocator.getAstNodePath(viewAst.body) + params.astPath;
        const node = this.services.workspace.AstNodeLocator.getAstNode(doc.parseResult.value, astPath);
        if (!node || !ast.isDynamicViewStep(node)) {
            logger.warn(`Failed to locate dynamic view step ${astPath} in view ${params.view}`);
            return null;
        }
        let targetNode = node.kind ? findNodeForProperty(node.$cstNode, 'kind') : undefined;
        targetNode ??= node.dotKind ? findNodeForProperty(node.$cstNode, 'dotKind') : undefined;
        targetNode ??= findNodeForKeyword(node.$cstNode, '->');
        targetNode ??= findNodeForKeyword(node.$cstNode, '<-');
        targetNode ??= findNodeForProperty(node.$cstNode, 'title');
        targetNode ??= findNodeForProperty(node.$cstNode, 'target');
        targetNode ??= node.$cstNode;
        if (!targetNode) {
            return null;
        }
        return {
            uri: doc.uri.toString(),
            range: {
                start: targetNode.range.start,
                end: targetNode.range.start,
            },
        };
    }
}
