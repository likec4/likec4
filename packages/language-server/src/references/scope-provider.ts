import { type ProjectId, invariant, nonexhaustive } from '@likec4/core'
import type { AstNode, LangiumDocument } from 'langium'
import {
  type AstNodeDescription,
  type ReferenceInfo,
  type Scope,
  type Stream,
  AstUtils,
  DefaultScopeProvider,
  DocumentState,
  EMPTY_SCOPE,
  MultiMapScope,
  stream,
  StreamScope,
  WorkspaceCache,
} from 'langium'
import {
  ast,
  isFqnRefInsideGlobals,
  isFqnRefInsideModel,
  isLikeC4LangiumDocument,
} from '../ast'
import { logWarnError } from '../logger'
import type { DeploymentsIndex, FqnIndex } from '../model'
import { streamImports } from '../model/parser/ImportsParser'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'
import { elementRef, readStrictFqn } from '../utils/elementRef'
import type { IndexManager } from '../workspace'

const { getDocument } = AstUtils

export class LikeC4ScopeProvider extends DefaultScopeProvider {
  protected override readonly indexManager: IndexManager
  protected override globalScopeCache: WorkspaceCache<string, Scope>

  constructor(protected services: LikeC4Services) {
    super(services)
    this.indexManager = services.shared.workspace.IndexManager
    // Replaces the cache created by the base class, which is evicted on every `DocumentBuilder.onUpdate`.
    // Project scopes are built from the exports of IndexManager, and those change only in the
    // IndexedContent phase (same phase where FQN indexes are rebuilt) or when documents are deleted,
    // so it is enough to evict the cache there.
    this.globalScopeCache = new WorkspaceCache<string, Scope>(services.shared, DocumentState.IndexedContent)
  }

  protected get fqnIndex(): FqnIndex {
    return this.services.likec4.FqnIndex
  }

  protected get deploymentsIndex(): DeploymentsIndex {
    return this.services.likec4.DeploymentsIndex
  }

  /**
   * Entry point for the linker and completion.
   *
   * All references to elements and deployments go through one of these containers:
   * - `FqnRef` - relaxed reference: the head is resolved lexically (see {@link genScopeFqnRefHead}),
   *   every next segment among unique descendants of the previous one
   * - `StrictFqnRef` / `StrictFqnElementRef` - strict path (as in `extend a.b.c`),
   *   every segment must be a direct child of the previous one
   * - `Imported` - root elements of the project we import from
   *
   * Everything else (kinds, tags, views, icons...) is resolved against the project scope.
   */
  override getScope(context: ReferenceInfo): Scope {
    const referenceType = this.reflection.getReferenceType(context)
    try {
      const container = context.container
      if (ast.isFqnRef(container)) {
        return this.scopeForFqnRef(container, context)
      }
      if (ast.isStrictFqnRef(container) || ast.isStrictFqnElementRef(container)) {
        return this.scopeForStrictFqnRef(container)
      }

      if (ast.isImported(container)) {
        // Project ID here is the project we import from, not the project of the document
        const projectId = projectIdFrom(container)
        return scope(this.fqnIndex.rootElements(projectId))
      }

      // Fallback to project scope for other types
      return this.projectScope(
        referenceType,
        context,
      )
    } catch (e) {
      logWarnError(e)
      return EMPTY_SCOPE
    }
  }

  /**
   * Yields children of the element and its descendants with unique names (see `FqnIndex.uniqueDescedants`).
   * Generator on purpose: FQN of the element is resolved lazily, only when the scope is actually queried.
   *
   * Pass `referencingProject`, the project of the reference, unless the element is imported:
   * the element's document may be shared between projects, see {@link descendantsProjectOf}.
   * Without it, descendants are looked up in the project of the element's document,
   * so for imported elements - in the project they are imported from.
   */
  protected *genUniqueDescedants(
    element: ast.Element | ast.DeploymentNode | undefined,
    referencingProject?: ProjectId,
  ) {
    if (!element) {
      return
    }
    const projectId = referencingProject
      ? this.descendantsProjectOf(element, referencingProject)
      : projectIdFrom(element)

    if (ast.isElement(element)) {
      const fqn = this.fqnIndex.getFqn(element)
      yield* this.fqnIndex.uniqueDescedants(projectId, fqn)
      return
    }
    if (ast.isDeploymentNode(element)) {
      const fqn = this.deploymentsIndex.getFqn(element)
      yield* this.deploymentsIndex.uniqueDescedants(projectId, fqn)
    }
  }

  /**
   * Project whose index holds the descendants of `element` as seen from `projectId`.
   * A document included by several projects can be extended in any of them, so the referencing project wins.
   */
  protected descendantsProjectOf(element: AstNode, projectId: ProjectId): ProjectId {
    return this.services.shared.workspace.ProjectsManager.isIncluded(projectId, getDocument(element))
      ? projectId
      : projectIdFrom(element)
  }

  protected *genScopeExtendElement(
    { element }: ast.ExtendElement,
    referencingProject: ProjectId,
  ): Generator<AstNodeDescription> {
    if (element.el.$nodeDescription) {
      yield element.el.$nodeDescription
      yield {
        ...element.el.$nodeDescription,
        name: 'this',
      }
      yield {
        ...element.el.$nodeDescription,
        name: 'it',
      }
    }
    // we make extended element resolvable inside ExtendElementBody
    yield* this.genUniqueDescedants(elementRef(element), referencingProject)
  }

  protected *genScopeElementView(
    { viewOf, extends: ext }: ast.ElementView,
    referencingProject: ProjectId,
  ): Generator<AstNodeDescription> {
    if (viewOf) {
      // If we have "view of parent.target"
      // we make "target" resolvable inside ElementView
      if (viewOf.modelElement.value.$nodeDescription) {
        yield viewOf.modelElement.value.$nodeDescription
      }
      yield* this.genUniqueDescedants(elementRef(viewOf), referencingProject)
      return
    }

    if (ext) {
      const view = ext.view.ref
      if (view) {
        yield* this.genScopeElementView(view, referencingProject)
      }
    }
  }

  /**
   * Scope for strict references (`extend a.b.c { }` in model and deployment).
   *
   * No lexical lookup and no "unique descendant" shortcuts here:
   * the head is resolved against root elements of the project only,
   * every next segment against direct children of the previous one.
   */
  protected scopeForStrictFqnRef(container: ast.StrictFqnRef | ast.StrictFqnElementRef): Scope {
    const parent = container.parent
    const projectId = projectIdFrom(container)
    if (ast.isStrictFqnElementRef(container)) {
      return parent
        ? scope(this.fqnIndex.directChildrenOf(projectId, readStrictFqn(parent)))
        : scope(this.fqnIndex.rootElements(projectId))
    }
    invariant(ast.isStrictFqnRef(container))
    return parent
      ? scope(
        this.deploymentsIndex
          .directChildrenOf(projectId, readStrictFqn(parent))
          .filter(desc => this.reflection.isSubtype(desc.type, ast.DeploymentNode.$type)),
      )
      // By grammar, only deployment nodes can be at the root of deployment model, so no filter needed
      : scope(
        this.deploymentsIndex.rootElements(projectId),
      )
  }

  protected *genScopeExtendDeployment(
    { deploymentNode }: ast.ExtendDeployment,
    referencingProject: ProjectId,
  ): Generator<AstNodeDescription> {
    if (deploymentNode.value.$nodeDescription) {
      yield deploymentNode.value.$nodeDescription
    }
    const target = deploymentNode.value.ref
    if (target && ast.isDeploymentNode(target)) {
      yield* this.genUniqueDescedants(target, referencingProject)
    }
  }

  /**
   * Scope for relaxed references (`a.b.c`):
   * - head (`a`) is resolved lexically, see {@link genScopeFqnRefHead}
   * - every next segment is resolved among children and unique descendants of the previous one,
   *   so `a.c` is valid if `c` is the only descendant of `a` with this name
   */
  protected scopeForFqnRef(
    container: ast.FqnRef,
    context: ReferenceInfo,
  ): Scope {
    const parent = container.parent
    if (!parent) {
      return new DistinctAllElements(this.genScopeFqnRefHead(context))
    }
    const parentRef = parent.value.ref
    if (!parentRef) {
      // Parent is not resolved, linking error is reported there, nothing to offer for the tail
      return EMPTY_SCOPE
    }
    // Find the element whose descendants are in scope:
    // imported element and deployed instance are "transparent" and expose descendants of the referenced element
    let parentEl: ast.Element | ast.DeploymentNode | undefined
    // Imported elements are looked up in the project they are imported from, so they leave it unset
    let referencingProject: ProjectId | undefined
    switch (true) {
      case ast.isDeploymentNode(parentRef):
      case ast.isElement(parentRef):
        parentEl = parentRef
        referencingProject = projectIdFrom(container)
        break
      case ast.isImported(parentRef):
        parentEl = parentRef.imported.ref
        break
      case ast.isDeployedInstance(parentRef): {
        const target = parentRef.target.modelElement.value.ref
        switch (true) {
          case ast.isImported(target):
            parentEl = target.imported.ref
            break
          case ast.isElement(target):
            parentEl = target
            referencingProject = projectIdFrom(container)
            break
        }
        break
      }
      default:
        nonexhaustive(parentRef)
    }
    return parentEl ? scope(this.genUniqueDescedants(parentEl, referencingProject)) : EMPTY_SCOPE
  }

  /**
   * Generates candidates for the head of a FQN reference,
   * i.e. the first segment, that has no parent: `cloud` in `cloud.backend.api`.
   *
   * The order is significant: the linker takes the first candidate with matching name
   * and completion keeps the first candidate per type and name (see {@link DistinctAllElements}).
   * So candidates go from the closest to the farthest:
   * 1. lexical scope: enclosing containers of the reference, up to the document root ({@link computeScope})
   * 2. elements imported into the document
   * 3. root elements of the project, from all documents
   *
   * Which kinds of candidates are generated depends on where the reference is:
   * - model (and any `ElementRef`): model elements only
   * - `global { }` and view-independent rules of `views { }`: both model and deployment elements
   * - deployment model and deployment views: deployment elements first,
   *   model elements only inside a deployment view
   */
  protected *genScopeFqnRefHead(
    context: ReferenceInfo,
  ): Generator<AstNodeDescription> {
    const container = context.container
    const projectId = projectIdFrom(container)
    if (
      AstUtils.hasContainerOfType(container, ast.isElementRef) ||
      isFqnRefInsideModel(container)
    ) {
      // Inside model scope we only need to resolve elements
      yield* this.computeScope(context, ast.Element.$type)
      yield* this.genImportedScope(getDocument(container))
      yield* this.fqnIndex.rootElements(projectId)
      return
    }

    if (isFqnRefInsideGlobals(container)) {
      // Global rules can be applied to any view, so we need both model and deployment elements.
      // NOTE: document-local deployment elements go before root model elements from other documents
      yield* this.computeScope(context, ast.Element.$type)
      yield* this.computeScope(context, ast.DeploymentElement.$type)
      yield* this.genImportedScope(getDocument(container))
      yield* this.fqnIndex.rootElements(projectId)
      yield* this.deploymentsIndex.rootElements(projectId)
      return
    }

    // Deployment model or deployment view
    // First preference for deployment elements
    yield* this.computeScope(context, ast.DeploymentElement.$type)
    yield* this.deploymentsIndex.rootElements(projectId)

    // Second preference for model elements, but only if we are in deployment view
    // (deployment model refers to model elements via `ElementRef`, handled above)
    if (AstUtils.hasContainerOfType(container, ast.isDeploymentViewBody)) {
      yield* this.computeScope(context, ast.Element.$type)
      yield* this.genImportedScope(getDocument(container))
      yield* this.fqnIndex.rootElements(projectId)
    }
  }
  /**
   * Generates lexical (document-local) candidates for a given reference context.
   *
   * Walks up from the reference to the document root and on every level yields:
   * - local symbols precomputed by `LikeC4ScopeComputation` (declared elements, `this`/`it`,
   *   and descendants with unique names), filtered by the reference type
   * - elements made visible by the container itself: the extended element and its descendants
   *   inside `extend`, or the element from `view of` inside the view
   *
   * Does NOT include imported elements and project-wide candidates,
   * the caller appends them (see {@link genScopeFqnRefHead}).
   *
   * @param context - The reference information containing the context for which the scope is being computed.
   * @param referenceType - The type of reference being resolved. Defaults to the reference type derived from the context.
   */
  protected *computeScope(
    context: ReferenceInfo,
    referenceType = this.reflection.getReferenceType(context),
  ): Generator<AstNodeDescription> {
    const isElementReference = this.reflection.isSubtype(referenceType, ast.Element.$type)
    const isDeploymentReference = this.reflection.isSubtype(referenceType, ast.DeploymentElement.$type)

    const doc = getDocument(context.container)
    const precomputed = doc.localSymbols
    const referencingProject = projectIdFrom(context.container)

    const byReferenceType = (desc: AstNodeDescription) => this.reflection.isSubtype(desc.type, referenceType)
    let container: AstNode | undefined = context.container

    // Walk up the container hierarchy to find containers with scopes
    // Prefer local precomputed scopes when available
    while (container) {
      if (precomputed && precomputed.has(container)) {
        const elements = precomputed.getStream(container).filter(byReferenceType)
        yield* elements
      }

      if (isDeploymentReference && ast.isExtendDeploymentBody(container)) {
        yield* this.genScopeExtendDeployment(container.$container, referencingProject)
      }
      if (isElementReference && ast.isExtendElementBody(container)) {
        yield* this.genScopeExtendElement(container.$container, referencingProject)
      }
      if (isElementReference && ast.isElementViewBody(container)) {
        yield* this.genScopeElementView(container.$container, referencingProject)
      }

      container = container.$container
    }
  }

  /**
   * Returns the scope with everything exported by the documents of the project
   * (see `LikeC4ScopeComputation.collectExportedSymbols`), filtered by the reference type.
   * Cached per project and reference type.
   *
   * Bundled icons are the only exception: they are shared between all projects.
   */
  protected projectScope(referenceType: string, context: ReferenceInfo): Scope {
    if (this.reflection.isSubtype(referenceType, ast.LibIcon.$type)) {
      return super.getGlobalScope(referenceType, context)
    }
    const projectId = projectIdFrom(context.container)
    return this.globalScopeCache.get(
      `${projectId}::${referenceType}`,
      () => new MultiMapScope(this.indexManager.projectElements(projectId, referenceType)),
    )
  }

  /**
   * There is no workspace-wide scope: "global" for a document is its project.
   */
  protected override getGlobalScope(referenceType: string, context: ReferenceInfo): Scope {
    return this.projectScope(referenceType, context)
  }

  /**
   * Yields elements imported into the document (`import { a, b } from 'project'`).
   * Descriptions point to `Imported` nodes (not to the elements), named after the imported element.
   */
  protected *genImportedScope(document: LangiumDocument): Generator<AstNodeDescription> {
    invariant(isLikeC4LangiumDocument(document))
    for (const [, imported] of streamImports(document)) {
      yield this.descriptions.createDescription(imported, imported.imported.$refText, document)
    }
  }
}

/**
 * Scope over candidates ordered from the closest to the farthest (may contain same name several times).
 *
 * Linking is not affected by duplicates: `getElement` returns the first match, i.e. the closest one.
 */
class DistinctAllElements extends StreamScope {
  constructor(elements: Generator<AstNodeDescription>) {
    super(stream(elements))
  }

  // For auto-completion we need to deduplicate elements by type and name
  // to avoid showing the same element multiple times with different fqn prefixes
  // So in auto-completion we get the closest occurrence of the element
  override getAllElements(): Stream<AstNodeDescription> {
    return this.elements.distinct(e => `${e.type}|${e.name}`)
  }
}

/**
 * Wraps the source into a lazy scope.
 *
 * NOTE: A scope created from a generator is single-pass: after the first `getElement`/`getAllElements`
 * the generator is (partially) consumed and next queries will miss candidates.
 * This is fine for the linker and completion (one query per `getScope` call), but do not keep or reuse such scope.
 */
function scope(source: Stream<AstNodeDescription> | Generator<AstNodeDescription>): Scope {
  return new StreamScope(stream(source))
}
