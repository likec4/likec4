// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.
import { invariant, nonNullable } from '@likec4/core';
import { Fqn, isAnyOf } from '@likec4/core/types';
import { ancestorsFqn, compareNatural, DefaultWeakMap, MultiMap, sortNaturalByFqn, } from '@likec4/core/utils';
import { AstUtils, DocumentState, stream, UriUtils, WorkspaceCache, } from 'langium';
import { filter, flatMap, hasAtLeast, isTruthy, pipe } from 'remeda';
import { ast, ElementOps, isLikeC4LangiumDocument, } from '../ast';
import { isNotLikeC4Builtin } from '../likec4lib';
import { logger } from '../logger';
import { ADisposable } from '../utils';
import { readStrictFqn } from '../utils/elementRef';
import { ProjectsManager } from '../workspace';
const isIndexableElement = isAnyOf(ast.isElement, ast.isExtendElement);
export class FqnIndex extends ADisposable {
    services;
    projects;
    langiumDocuments;
    documentCache;
    workspaceCache;
    logger = logger.getChild('fqn-index');
    constructor(services) {
        super();
        this.services = services;
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
        this.projects = services.shared.workspace.ProjectsManager;
        this.documentCache = new DefaultWeakMap(doc => this.createDocumentIndex(doc));
        this.workspaceCache = new WorkspaceCache(services.shared, DocumentState.IndexedContent);
        this.onDispose(services.shared.workspace.DocumentBuilder.onDocumentPhase(DocumentState.IndexedContent, (doc) => {
            if (isLikeC4LangiumDocument(doc) && isNotLikeC4Builtin(doc)) {
                this.documentCache.delete(doc);
            }
        }));
    }
    documents(projectId) {
        return this.langiumDocuments
            .projectDocuments(projectId)
            .filter(d => d.state >= DocumentState.IndexedContent);
    }
    get(document) {
        if (document.state < DocumentState.IndexedContent) {
            this.logger.warn(`document {doc} is in state {state}, expected at least IndexedContent ({expect}). This may lead to incorrect FQN resolution.`, {
                doc: UriUtils.basename(document.uri),
                state: document.state,
                expect: DocumentState.IndexedContent,
            });
        }
        return this.documentCache.get(document);
    }
    resolve(reference) {
        if (reference.$type === 'Imported') {
            return this.getFqn(reference.imported.ref);
        }
        if (reference.$type === 'Element') {
            return this.getFqn(reference);
        }
        return this.services.likec4.DeploymentsIndex.getFqn(reference);
    }
    getFqn(el) {
        invariant(ast.isElement(el) || ast.isDeploymentElement(el));
        let id = ElementOps.readId(el);
        if (isTruthy(id)) {
            return id;
        }
        // Document index is not yet created
        const doc = AstUtils.getDocument(el);
        this.logger.warn(`document {doc} is not yet indexed, creating on the fly to resolve FQN for element {el}`, {
            el: el.name ?? el.$type,
            doc: UriUtils.basename(doc.uri),
        });
        invariant(isLikeC4LangiumDocument(doc));
        // Ensure the document is indexed
        this.get(doc);
        // This will create the document index
        return nonNullable(ElementOps.readId(el), 'Element fqn must be set, invalid state');
    }
    byFqn(projectId, fqn) {
        return stream(this.workspaceCache.get(`${projectId}:fqn:${fqn}`, () => {
            return this
                .documents(projectId)
                .flatMap(doc => this.get(doc).byFqn(fqn))
                .toArray();
        }));
    }
    rootElements(projectId) {
        return stream(this.workspaceCache.get(`${projectId}:rootElements`, () => {
            const allroots = new MultiMap();
            for (const doc of this.documents(projectId)) {
                for (const desc of this.get(doc).rootElements()) {
                    allroots.set(desc.name, desc);
                }
            }
            return uniqueByName(allroots);
        }));
    }
    directChildrenOf(projectId, parent) {
        return stream(this.workspaceCache.get(`${projectId}:directChildrenOf:${parent}`, () => {
            const allchildren = new MultiMap();
            for (const doc of this.documents(projectId)) {
                for (const desc of this.get(doc).children(parent)) {
                    allchildren.set(desc.name, desc);
                }
            }
            return uniqueByName(allchildren);
        }));
    }
    /**
     * Returns descedant elements with unique names in the scope
     */
    uniqueDescedants(projectId, parent) {
        return stream(this.workspaceCache.get(`${projectId}:uniqueDescedants:${parent}`, () => {
            const children = new MultiMap(), descendants = new MultiMap();
            for (const doc of this.documents(projectId)) {
                const docIndex = this.get(doc);
                for (const child of docIndex.children(parent)) {
                    children.set(child.name, child);
                }
                for (const desc of docIndex.descendants(parent)) {
                    descendants.set(desc.name, desc);
                }
            }
            const uniqueChildren = uniqueByName(children);
            const uniqueDescendants = [...descendants.associations()]
                .flatMap(([_name, descs]) => descs.length === 1 && !children.has(_name) ? descs : []);
            return [
                ...uniqueChildren,
                ...sortNaturalByFqn(uniqueDescendants),
            ];
        }));
    }
    createDocumentIndex(document) {
        const rootElements = document.parseResult.value
            .models
            .flatMap(m => m.elements.filter(isIndexableElement));
        if (rootElements.length === 0) {
            return DocumentFqnIndex.EMPTY;
        }
        const projectId = document.likec4ProjectId ?? this.projects.ownerProjectId(document);
        const root = new Array();
        const children = new MultiMap();
        const descendants = new MultiMap();
        const byfqn = new MultiMap();
        const Descriptions = this.services.workspace.AstNodeDescriptionProvider;
        const createAndSaveDescription = (node, name, fqn) => {
            const desc = Object.assign(Descriptions.createDescription(node, name, document), {
                id: fqn,
                likec4ProjectId: projectId,
            });
            ElementOps.writeId(node, fqn);
            byfqn.set(fqn, desc);
            return desc;
        };
        function traverseElement(el, parentFqn) {
            const thisFqn = Fqn(el.name, parentFqn);
            const desc = createAndSaveDescription(el, el.name, thisFqn);
            if (!parentFqn) {
                root.push(desc);
            }
            else {
                children.set(parentFqn, desc);
            }
            const nested = filter(el.body?.elements ?? [], isIndexableElement);
            if (!hasAtLeast(nested, 1)) {
                return [desc];
            }
            const traversedNested = nested.flatMap(child => traverseElement(child, thisFqn));
            for (const descendant of traversedNested) {
                descendants.set(thisFqn, descendant);
            }
            return [desc, ...traversedNested];
        }
        function traverseExtendElement(el) {
            const thisFqn = readStrictFqn(el.element);
            const nested = pipe(el.body?.elements ?? [], filter(ast.isElement), flatMap(child => traverseElement(child, thisFqn)));
            if (nested.length === 0) {
                return;
            }
            for (const ancestor of [thisFqn, ...ancestorsFqn(thisFqn)]) {
                for (const child of nested) {
                    descendants.set(ancestor, child);
                }
            }
        }
        for (const node of rootElements) {
            try {
                if (ast.isExtendElement(node)) {
                    traverseExtendElement(node);
                    continue;
                }
                traverseElement(node, null);
            }
            catch (error) {
                this.logger.warn(`Error while traversing element {el} in document {doc}`, {
                    el: node.$type,
                    doc: UriUtils.basename(document.uri),
                    error,
                });
            }
        }
        return new DocumentFqnIndex(root, children, descendants, byfqn, projectId);
    }
}
function uniqueByName(multimap) {
    return [...multimap.associations()]
        .flatMap(([_name, descs]) => (descs.length === 1 ? descs : []))
        .sort((a, b) => compareNatural(a.name, b.name));
}
export class DocumentFqnIndex {
    _rootElements;
    _children;
    _descendants;
    _byfqn;
    projectId;
    static EMPTY = new DocumentFqnIndex([], new MultiMap(), new MultiMap(), new MultiMap(), ProjectsManager.DefaultProjectId);
    constructor(_rootElements, 
    /**
     * direct children of elements
     */
    _children, 
    /**
     * All descendants of an element (unique by name)
     */
    _descendants, 
    /**
     * All elements by FQN
     */
    _byfqn, projectId) {
        this._rootElements = _rootElements;
        this._children = _children;
        this._descendants = _descendants;
        this._byfqn = _byfqn;
        this.projectId = projectId;
    }
    rootElements() {
        return this._rootElements;
    }
    byFqn(fqn) {
        return this._byfqn.get(fqn) ?? [];
    }
    children(parent) {
        return this._children.get(parent) ?? [];
    }
    descendants(nodeName) {
        return this._descendants.get(nodeName) ?? [];
    }
}
