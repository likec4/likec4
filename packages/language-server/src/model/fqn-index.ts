// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { invariant, nonNullable } from '@likec4/core'
import { type NonEmptyArray, type ProjectId, Fqn, isAnyOf } from '@likec4/core/types'
import {
  ancestorsFqn,
  compareNatural,
  MultiMap,
  sortNaturalByFqn,
} from '@likec4/core/utils'
import {
  type LangiumDocument,
  type Stream,
  AstUtils,
  ContextCache,
  DocumentState,
  SimpleCache,
  stream,
  UriUtils,
} from 'langium'
import { filter, flatMap, forEach, hasAtLeast, isTruthy, pipe } from 'remeda'
import {
  type AstNodeDescriptionWithFqn,
  type LikeC4LangiumDocument,
  ast,
  ElementOps,
  isLikeC4LangiumDocument,
} from '../ast'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable } from '../utils'
import { readStrictFqn } from '../utils/elementRef'
import { type LangiumDocuments, ProjectsManager } from '../workspace'

const isIndexableElement = isAnyOf(ast.isElement, ast.isExtendElement)

export class FqnIndex<AstNd = ast.Element> extends ADisposable {
  protected projects: ProjectsManager
  protected langiumDocuments: LangiumDocuments
  protected documentCache: SimpleCache<string, DocumentFqnIndex>
  protected workspaceCache: ContextCache<ProjectId, string, AstNodeDescriptionWithFqn[]>

  protected logger = logger.getChild('fqn-index')

  constructor(
    protected services: LikeC4Services,
  ) {
    super()
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
    this.projects = services.shared.workspace.ProjectsManager

    this.onDispose(
      this.documentCache = new SimpleCache(),
      this.workspaceCache = new ContextCache(),
      services.shared.workspace.DocumentBuilder.onDocumentResetBelow(
        DocumentState.IndexedContent,
        ({ doc }) => {
          if (this.documentCache.delete(doc.textDocument.uri) && this.logger.isEnabledFor('trace')) {
            this.logger.trace(
              `clear cache for ${services.shared.workspace.WorkspaceManager.relativePath(doc.textDocument.uri)}`,
            )
          }
        },
      ),
      services.shared.workspace.DocumentBuilder.onDocumentPhase(
        DocumentState.IndexedContent,
        (doc) => {
          if (isLikeC4LangiumDocument(doc)) {
            this.documentCache.set(doc.textDocument.uri, this.createDocumentIndex(doc))

            // Clear workspace cache for this document's project
            if (doc.likec4ProjectId) {
              this.workspaceCache.clear(doc.likec4ProjectId)
            }
          }
        },
      ),
      services.shared.workspace.DocumentBuilder.onUpdate((_changed, deleted) => {
        if (deleted.length > 0) { // react only on deleted documents
          forEach(deleted, uri => this.documentCache.delete(uri.toString()))
        }
        this.workspaceCache.clear()
      }),
    )
  }

  private documents(projectId: ProjectId) {
    return this.langiumDocuments
      .projectDocuments(projectId)
      .filter(d => d.state >= DocumentState.IndexedContent)
  }

  public get(document: LikeC4LangiumDocument): DocumentFqnIndex {
    if (document.state < DocumentState.IndexedContent) {
      this.logger.warn(
        `document {doc} is in state {state}, expected at least IndexedContent ({expect}). This may lead to incorrect FQN resolution.`,
        {
          doc: UriUtils.basename(document.uri),
          state: document.state,
          expect: DocumentState.IndexedContent,
        },
      )
    }
    return this.documentCache.get(document.textDocument.uri, () => {
      const index = this.createDocumentIndex(document)
      this.workspaceCache.clear(index.projectId)
      return index
    })
  }

  public resolve(reference: ast.Referenceable): Fqn {
    if (reference.$type === 'Imported') {
      return this.getFqn(reference.imported.ref as AstNd)
    }
    if (reference.$type === 'Element') {
      return this.getFqn(reference as AstNd)
    }
    return this.services.likec4.DeploymentsIndex.getFqn(reference)
  }

  public getFqn(el: AstNd): Fqn {
    invariant(ast.isElement(el) || ast.isDeploymentElement(el))
    let id = ElementOps.readId(el)
    if (isTruthy(id)) {
      return id
    }
    // Document index is not yet created
    const doc = AstUtils.getDocument(el)
    if (doc.state < DocumentState.IndexedContent) {
      this.logger.warn(
        `document {doc} is not yet indexed, creating on the fly to resolve FQN for element {el}`,
        {
          el: el.name ?? el.$type,
          doc: UriUtils.basename(doc.uri),
        },
      )
    }
    // Side effect - parse document that also sets element fqn
    this.updateDocumentIndex(doc)
    // This will create the document index
    return nonNullable(ElementOps.readId(el), 'Element fqn must be set, invalid state')
  }

  public byFqn(projectId: ProjectId, fqn: Fqn): Stream<AstNodeDescriptionWithFqn> {
    return stream(this.workspaceCache.get(projectId, `fqn:${fqn}`, () => {
      return this
        .documents(projectId)
        .flatMap(doc => this.get(doc).byFqn(fqn))
        .toArray()
    }))
  }

  /**
   * Returns all elements of the project (from all documents, including nested
   * elements and elements added in `extend` blocks), in document order.
   * The same FQN may appear more than once if it is defined in several documents.
   */
  public elements(projectId: ProjectId): Stream<AstNodeDescriptionWithFqn> {
    return stream(this.workspaceCache.get(projectId, `elements`, () => {
      return this
        .documents(projectId)
        .flatMap(doc => this.get(doc).elements())
        .toArray()
    }))
  }

  public rootElements(projectId: ProjectId): Stream<AstNodeDescriptionWithFqn> {
    return stream(
      this.workspaceCache.get(projectId, `rootElements`, () => {
        const allroots = new MultiMap<string, AstNodeDescriptionWithFqn>()
        for (const doc of this.documents(projectId)) {
          for (const desc of this.get(doc).rootElements()) {
            allroots.set(desc.name, desc)
          }
        }
        return uniqueByName(allroots)
      }),
    )
  }

  public directChildrenOf(projectId: ProjectId, parent: Fqn): Stream<AstNodeDescriptionWithFqn> {
    return stream(
      this.workspaceCache.get(projectId, `directChildrenOf:${parent}`, () => {
        const allchildren = new MultiMap<string, AstNodeDescriptionWithFqn>()
        for (const doc of this.documents(projectId)) {
          for (const desc of this.get(doc).children(parent)) {
            allchildren.set(desc.name, desc)
          }
        }
        return uniqueByName(allchildren)
      }),
    )
  }

  /**
   * Returns descedant elements with unique names in the scope
   */
  public uniqueDescedants(projectId: ProjectId, parent: Fqn): Stream<AstNodeDescriptionWithFqn> {
    return stream(
      this.workspaceCache.get(projectId, `uniqueDescedants:${parent}`, () => {
        const children = new MultiMap<string, AstNodeDescriptionWithFqn>(),
          descendants = new MultiMap<string, AstNodeDescriptionWithFqn>()

        for (const doc of this.documents(projectId)) {
          const docIndex = this.get(doc)
          for (const child of docIndex.children(parent)) {
            children.set(child.name, child)
          }
          for (const desc of docIndex.descendants(parent)) {
            descendants.set(desc.name, desc)
          }
        }
        const uniqueChildren = uniqueByName(children)

        const uniqueDescendants = [...descendants.associations()]
          .flatMap(([_name, descs]) => descs.length === 1 && !children.has(_name) ? descs : [])

        return [
          ...uniqueChildren,
          ...sortNaturalByFqn(uniqueDescendants),
        ]
      }),
    )
  }

  protected updateDocumentIndex(doc: LangiumDocument): asserts doc is LikeC4LangiumDocument {
    invariant(isLikeC4LangiumDocument(doc))
    const index = this.createDocumentIndex(doc)
    this.documentCache.set(doc.textDocument.uri, index)

    // Clear workspace cache for this document's project
    this.workspaceCache.clear(index.projectId)

    if (doc.state < DocumentState.IndexedContent) {
      this.logger.warn(
        `document {doc} is in state {state}, expected at least IndexedContent ({expect}). This may lead to incorrect FQN resolution.`,
        {
          doc: UriUtils.basename(doc.uri),
          state: doc.state,
          expect: DocumentState.IndexedContent,
        },
      )
    }
  }

  protected createDocumentIndex(document: LikeC4LangiumDocument): DocumentFqnIndex {
    const { models, diffs } = document.parseResult.value
    const rootElements = [...models, ...diffs.flatMap(d => d.adds)].flatMap(c => c.elements.filter(isIndexableElement))

    if (rootElements.length === 0) {
      return DocumentFqnIndex.EMPTY
    }
    const projectId = document.likec4ProjectId ?? this.projects.ownerProjectId(document)
    const root = new Array<AstNodeDescriptionWithFqn>()
    const children = new MultiMap<Fqn, AstNodeDescriptionWithFqn>()
    const descendants = new MultiMap<Fqn, AstNodeDescriptionWithFqn>()
    const byfqn = new MultiMap<Fqn, AstNodeDescriptionWithFqn>()
    const Descriptions = this.services.workspace.AstNodeDescriptionProvider

    const createAndSaveDescription = (node: ast.Element, name: string, fqn: Fqn): AstNodeDescriptionWithFqn => {
      const desc = Object.assign(
        Descriptions.createDescription(node, name, document),
        {
          id: fqn,
          likec4ProjectId: projectId,
        },
      )
      ElementOps.writeId(node, fqn)
      byfqn.set(fqn, desc)
      return desc
    }

    function traverseElement(el: ast.Element, parentFqn: Fqn | null): NonEmptyArray<AstNodeDescriptionWithFqn> {
      const thisFqn = Fqn(el.name, parentFqn)
      const desc = createAndSaveDescription(el, el.name, thisFqn)
      if (!parentFqn) {
        root.push(desc)
      } else {
        children.set(parentFqn, desc)
      }

      const nested = filter(el.body?.elements ?? [], isIndexableElement)
      if (!hasAtLeast(nested, 1)) {
        return [desc]
      }

      const traversedNested = flatMap(nested, child => traverseElement(child, thisFqn))
      for (const descendant of traversedNested) {
        descendants.set(thisFqn, descendant)
      }

      return [desc, ...traversedNested]
    }

    function traverseExtendElement(el: ast.ExtendElement) {
      const thisFqn = readStrictFqn(el.element)
      const nested = pipe(
        el.body?.elements ?? [],
        filter(ast.isElement),
        flatMap(child => traverseElement(child, thisFqn)),
      )
      if (nested.length === 0) {
        return
      }
      for (const ancestor of [thisFqn, ...ancestorsFqn(thisFqn)]) {
        for (const child of nested) {
          descendants.set(ancestor, child)
        }
      }
    }

    for (const node of rootElements) {
      try {
        if (ast.isExtendElement(node)) {
          traverseExtendElement(node)
          continue
        }
        traverseElement(node, null)
      } catch (error) {
        this.logger.warn(
          `Error while traversing element {el} in document {doc}`,
          {
            el: node.$type,
            doc: UriUtils.basename(document.uri),
            error,
          },
        )
      }
    }

    return new DocumentFqnIndex(root, children, descendants, byfqn, projectId)
  }
}

function compareNaturalByName(a: AstNodeDescriptionWithFqn, b: AstNodeDescriptionWithFqn) {
  return compareNatural(a.name, b.name)
}

function uniqueByName(multimap: MultiMap<string, AstNodeDescriptionWithFqn>) {
  return [...multimap.associations()]
    .flatMap(([_name, descs]) => (descs.length === 1 ? descs : []))
    .sort(compareNaturalByName)
}

export class DocumentFqnIndex {
  static readonly EMPTY = new DocumentFqnIndex(
    [],
    new MultiMap(),
    new MultiMap(),
    new MultiMap(),
    ProjectsManager.DefaultProjectId,
  )

  constructor(
    private _rootElements: Array<AstNodeDescriptionWithFqn>,
    /**
     * direct children of elements
     */
    private _children: MultiMap<Fqn, AstNodeDescriptionWithFqn>,
    /**
     * All descendants of an element (unique by name)
     */
    private _descendants: MultiMap<Fqn, AstNodeDescriptionWithFqn>,
    /**
     * All elements by FQN
     */
    private _byfqn: MultiMap<Fqn, AstNodeDescriptionWithFqn>,
    public readonly projectId: ProjectId,
  ) {}

  public rootElements(): readonly AstNodeDescriptionWithFqn[] {
    return this._rootElements
  }

  public byFqn(fqn: Fqn): readonly AstNodeDescriptionWithFqn[] {
    return this._byfqn.get(fqn) ?? []
  }

  /**
   * All elements of the document
   */
  public elements(): readonly AstNodeDescriptionWithFqn[] {
    return [...this._byfqn.values()]
  }

  public children(parent: Fqn): readonly AstNodeDescriptionWithFqn[] {
    return this._children.get(parent) ?? []
  }

  public descendants(nodeName: Fqn): readonly AstNodeDescriptionWithFqn[] {
    return this._descendants.get(nodeName) ?? []
  }
}
