import { nonexhaustive } from '@likec4/core';
import { DefaultScopeComputation, MultiMap, } from 'langium';
import { entries, filter, flatMap, forEachObj, groupBy, isNullish, isTruthy, pipe } from 'remeda';
import { ast } from '../ast';
import { logWarnError } from '../logger';
function uniqueDescriptions(descs) {
    return pipe(descs, groupBy(desc => `${desc.type}.${desc.name}`), entries(), flatMap(([_, descs]) => descs.length === 1 ? descs : []));
}
export class LikeC4ScopeComputation extends DefaultScopeComputation {
    constructor(services) {
        super(services);
    }
    async computeExports(document, _cancelToken) {
        const docExports = [];
        try {
            const { specifications, models, views, globals, likec4lib, deployments, } = document.parseResult.value;
            // Process library
            this.exportLibrary(likec4lib, docExports, document);
            // Process specification
            this.exportSpecification(specifications, docExports, document);
            // Process models
            this.exportModel(models, docExports, document);
            // Process views
            this.exportViews(views, docExports, document);
            // Process global
            this.exportGlobals(globals, docExports, document);
            this.exportDeployments(deployments, docExports, document);
        }
        catch (e) {
            logWarnError(e);
        }
        return docExports;
    }
    exportViews(modelViews, docExports, document) {
        const views = modelViews?.flatMap(m => m.views);
        if (isNullish(views) || views.length === 0) {
            return;
        }
        for (const viewAst of views) {
            try {
                if (isTruthy(viewAst.name)) {
                    docExports.push(this.descriptions.createDescription(viewAst, viewAst.name, document));
                }
            }
            catch (e) {
                logWarnError(e);
            }
        }
    }
    exportGlobals(globals, docExports, document) {
        if (isNullish(globals) || globals.length === 0) {
            return;
        }
        for (const globalPredicateAst of globals.flatMap(g => g.predicates)) {
            try {
                const id = globalPredicateAst;
                if (isTruthy(id.name)) {
                    docExports.push(this.descriptions.createDescription(id, id.name, document));
                }
            }
            catch (e) {
                logWarnError(e);
            }
        }
        for (const globalStyleAst of globals.flatMap(g => g.styles)) {
            try {
                const id = globalStyleAst.id;
                if (isTruthy(id.name)) {
                    docExports.push(this.descriptions.createDescription(id, id.name, document));
                }
            }
            catch (e) {
                logWarnError(e);
            }
        }
    }
    exportModel(models, docExports, document) {
        if (isNullish(models) || models.length === 0) {
            return;
        }
        for (const elAst of models.flatMap(m => m.elements)) {
            try {
                if (ast.isElement(elAst) && isTruthy(elAst.name)) {
                    docExports.push(this.descriptions.createDescription(elAst, elAst.name, document));
                }
            }
            catch (e) {
                logWarnError(e);
            }
        }
    }
    exportLibrary(likec4lib, docExports, document) {
        if (isNullish(likec4lib)) {
            return;
        }
        try {
            for (const iconAst of likec4lib.flatMap(l => l.icons)) {
                docExports.push(this.descriptions.createDescription(iconAst, iconAst.name, document));
            }
        }
        catch (e) {
            logWarnError(e);
        }
    }
    exportSpecification(specifications, docExports, document) {
        if (isNullish(specifications) || specifications.length === 0) {
            return;
        }
        for (const spec of specifications.flatMap(s => [
            ...s.elements,
            ...s.relationships,
            ...s.deploymentNodes,
            ...s.tags,
            ...s.colors,
        ])) {
            try {
                switch (true) {
                    case ast.isSpecificationDeploymentNodeKind(spec):
                    case ast.isSpecificationElementKind(spec): {
                        if (isTruthy(spec.kind.name)) {
                            docExports.push(this.descriptions.createDescription(spec.kind, spec.kind.name, document));
                        }
                        continue;
                    }
                    case ast.isSpecificationTag(spec): {
                        if (isTruthy(spec.tag.name)) {
                            docExports.push(this.descriptions.createDescription(spec.tag, spec.tag.name, document));
                        }
                        continue;
                    }
                    case ast.isSpecificationRelationshipKind(spec): {
                        if (isTruthy(spec.kind.name)) {
                            docExports.push(this.descriptions.createDescription(spec.kind, spec.kind.name, document));
                        }
                        continue;
                    }
                    case ast.isSpecificationColor(spec): {
                        if (isTruthy(spec.name.name)) {
                            docExports.push(this.descriptions.createDescription(spec.name, spec.name.name, document));
                        }
                        continue;
                    }
                    // Thow error if not exhaustive
                    default:
                        nonexhaustive(spec);
                }
            }
            catch (e) {
                logWarnError(e);
            }
        }
    }
    exportDeployments(modelDeployments, docExports, document) {
        const nodes = modelDeployments?.flatMap(m => m.elements);
        if (isNullish(nodes) || nodes.length === 0) {
            return;
        }
        for (const node of nodes) {
            try {
                if (ast.isDeploymentNode(node) && isTruthy(node.name)) {
                    docExports.push(this.descriptions.createDescription(node, node.name, document));
                }
            }
            catch (e) {
                logWarnError(e);
            }
        }
    }
    computeLocalScopes(document, _cancelToken) {
        return new Promise(resolve => {
            const root = document.parseResult.value;
            const descendants = [];
            const scopes = new MultiMap();
            for (const model of root.models) {
                try {
                    descendants.push(...this.processContainer(model, scopes, document));
                }
                catch (e) {
                    logWarnError(e);
                }
            }
            for (const deployment of root.deployments) {
                try {
                    descendants.push(...this.processDeployments(deployment, scopes, document));
                }
                catch (e) {
                    logWarnError(e);
                }
            }
            for (const imports of root.imports.flatMap(i => i.imports)) {
                try {
                    let imported = imports;
                    while (imported) {
                        descendants.push(this.descriptions.createDescription(imported, imported.imported.$refText));
                        imported = imported.prev;
                    }
                }
                catch (e) {
                    logWarnError(e);
                }
            }
            uniqueDescriptions(descendants).forEach(desc => {
                scopes.add(root, desc);
            });
            resolve(scopes);
        });
    }
    processContainer(container, scopes, document) {
        const localScope = new MultiMap();
        const descedants = [];
        for (const el of container.elements) {
            if (ast.isRelation(el)) {
                continue;
            }
            let subcontainer;
            if (ast.isElement(el)) {
                if (isTruthy(el.name)) {
                    localScope.add(el.name, this.descriptions.createDescription(el, el.name, document));
                }
                subcontainer = el.body;
                if (subcontainer) {
                    scopes.add(subcontainer, this.descriptions.createDescription(el, 'this', document));
                    scopes.add(subcontainer, this.descriptions.createDescription(el, 'it', document));
                }
            }
            else if (ast.isExtendElement(el)) {
                subcontainer = el.body;
            }
            if (subcontainer && subcontainer.elements.length > 0) {
                try {
                    descedants.push(...this.processContainer(subcontainer, scopes, document));
                }
                catch (e) {
                    logWarnError(e);
                }
            }
        }
        if (descedants.length) {
            pipe(descedants, filter(desc => !localScope.has(desc.name)), groupBy(desc => desc.name), forEachObj((descs, name) => {
                if (descs.length === 1) {
                    localScope.add(name, descs[0]);
                }
            }));
        }
        const local = [...localScope.values()];
        scopes.addAll(container, local);
        return local;
    }
    processDeployments(container, scopes, document) {
        const localScope = new MultiMap();
        const descedants = [];
        for (const el of container.elements) {
            if (ast.isDeploymentRelation(el)) {
                continue;
            }
            let subcontainer = el.body;
            if (!ast.isExtendDeployment(el)) {
                let name = this.nameProvider.getName(el);
                if (isTruthy(name)) {
                    const desc = this.descriptions.createDescription(el, name, document);
                    localScope.add(name, desc);
                }
                if (subcontainer) {
                    scopes.add(subcontainer, this.descriptions.createDescription(el, 'this', document));
                    scopes.add(subcontainer, this.descriptions.createDescription(el, 'it', document));
                }
            }
            if (subcontainer) {
                try {
                    descedants.push(...this.processDeployments(subcontainer, scopes, document));
                }
                catch (e) {
                    logWarnError(e);
                }
            }
        }
        if (descedants.length) {
            pipe(descedants, filter(desc => !localScope.has(desc.name)), groupBy(desc => desc.name), forEachObj((descs, name) => {
                if (descs.length === 1) {
                    localScope.add(name, descs[0]);
                }
            }));
        }
        const local = [...localScope.values()];
        scopes.addAll(container, local);
        return local;
    }
}
