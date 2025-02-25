import { nonexhaustive } from '@likec4/core'
import type { AstNode } from 'langium'
import {
  type AstNodeDescription,
  type ReferenceInfo,
  type Scope,
  type Stream,
  AstUtils,
  DefaultScopeProvider,
  DONE_RESULT,
  EMPTY_SCOPE,
  EMPTY_STREAM,
  MapScope,
  stream,
  StreamImpl,
  StreamScope,
} from 'langium'
import { ast } from '../ast'
import { logWarnError } from '../logger'
import type { DeploymentsIndex, FqnIndex } from '../model'
import type { LikeC4Services } from '../module'
import { elementRef, readStrictFqn } from '../utils/elementRef'

const { getDocument } = AstUtils

export class LikeC4ScopeProvider extends DefaultScopeProvider {
  private deploymentsIndex: DeploymentsIndex
  private fqnIndex: FqnIndex

  constructor(services: LikeC4Services) {
    super(services)
    this.fqnIndex = services.likec4.FqnIndex
    this.deploymentsIndex = services.likec4.DeploymentsIndex
  }

  // we need lazy resolving here
  private uniqueDescedants(of: () => ast.Element | ast.DeploymentNode | undefined): Stream<AstNodeDescription> {
    return new StreamImpl(
      () => {
        const element = of()
        if (element && ast.isElement(element)) {
          const fqn = this.fqnIndex.getFqn(element)
          return this.fqnIndex.uniqueDescedants(fqn).iterator()
        }
        if (element && ast.isDeploymentNode(element)) {
          const fqn = this.deploymentsIndex.getFqn(element)
          return this.deploymentsIndex.uniqueDescedants(fqn).iterator()
        }
        return null
      },
      iterator => {
        if (iterator) {
          return iterator.next()
        }
        return DONE_RESULT
      },
    )
  }

  override getScope(context: ReferenceInfo): Scope {
    try {
      const referenceType = this.reflection.getReferenceType(context)
      try {
        const container = context.container
        if (ast.isFqnRef(container)) {
          return this.getScopeForFqnRef(container, context)
        }
        if (ast.isStrictFqnRef(container)) {
          return this.getScopeForStrictFqnRef(container, context)
        }

        if (referenceType !== ast.Element) {
          return this.getGlobalScope(referenceType, context)
        }

        if (ast.isStrictFqnElementRef(container) && context.property === 'el') {
          const parent = container.parent
          if (!parent) {
            return this.getGlobalScope(referenceType, context)
          }
          return new StreamScope(this.fqnIndex.directChildrenOf(readStrictFqn(parent)))
        }
        if (ast.isElementRef(container) && context.property === 'el') {
          const parent = container.parent
          if (parent) {
            return new StreamScope(this.getScopeElementRef(parent))
          }
          // if we have elementRef "this" or "it" we resolve it to the closest element
          if (context.reference.$refText === 'this' || context.reference.$refText === 'it') {
            const closestElement = AstUtils.getContainerOfType(container, ast.isElement)
            if (closestElement) {
              return new MapScope([
                this.descriptions.createDescription(closestElement, context.reference.$refText),
              ])
            } else {
              return EMPTY_SCOPE
            }
          }
        }
        return this.computeScope(context)
      } catch (e) {
        logWarnError(e)
        return this.getGlobalScope(referenceType, context)
      }
    } catch (e) {
      logWarnError(e)
      return EMPTY_SCOPE
    }
  }

  private getScopeElementRef(ref: ast.ElementRef): Stream<AstNodeDescription> {
    return this.uniqueDescedants(() => ref.el.ref)
  }

  private getScopeExtendElement({ element }: ast.ExtendElement): Stream<AstNodeDescription> {
    // we make extended element resolvable inside ExtendElementBody
    return stream([element.el.$nodeDescription])
      .nonNullable()
      .concat(this.uniqueDescedants(() => elementRef(element)))
  }

  private getScopeElementView({ viewOf, extends: ext }: ast.ElementView): Stream<AstNodeDescription> {
    if (viewOf) {
      // If we have "view of parent.target"
      // we make "target" resolvable inside ElementView
      return stream([viewOf.el.$nodeDescription])
        .nonNullable()
        .concat(this.uniqueDescedants(() => elementRef(viewOf)))
    }
    if (ext) {
      return stream([ext]).flatMap(v => {
        const view = v.view.ref
        return view ? this.getScopeElementView(view) : EMPTY_STREAM
      })
    }
    return EMPTY_STREAM
  }

  private getScopeForStrictFqnRef(container: ast.StrictFqnRef, context: ReferenceInfo) {
    const parent = container.parent
    if (!parent) {
      return this.getGlobalScope(ast.DeploymentNode, context)
    }
    return new StreamScope(
      this.deploymentsIndex
        .directChildrenOf(readStrictFqn(parent))
        .filter(desc => this.reflection.isSubtype(desc.type, ast.DeploymentNode)),
    )
  }

  private getScopeExtendDeployment({ deploymentNode }: ast.ExtendDeployment): Stream<AstNodeDescription> {
    return stream([deploymentNode.value.$nodeDescription])
      .nonNullable()
      .concat(this.uniqueDescedants(() => {
        const target = deploymentNode.value.ref
        return target && ast.isDeploymentNode(target) ? target : undefined
      }))
  }

  protected getScopeForFqnRef(container: ast.FqnRef, context: ReferenceInfo) {
    const parent = container.parent
    if (!parent) {
      return this.createScope(
        // First preference for deployment nodes
        this.computeScope(context, ast.DeploymentNode).getAllElements(),
        this.createScope(
          // Second preference for deployed instances
          this.computeScope(context, ast.DeployedInstance).getAllElements(),
          // Third preference for elements if we are in deployment view
          AstUtils.hasContainerOfType(container, ast.isDeploymentView)
            ? this.computeScope(context, ast.Element)
            : EMPTY_SCOPE,
        ),
      )
    }
    const parentRef = parent.value.ref
    if (!parentRef) {
      return EMPTY_SCOPE
    }
    if (ast.isDeploymentNode(parentRef)) {
      return new StreamScope(this.uniqueDescedants(() => parentRef))
    }
    if (ast.isDeployedInstance(parentRef)) {
      return new StreamScope(this.getScopeElementRef(parentRef.element))
    }
    if (ast.isElement(parentRef)) {
      return new StreamScope(this.uniqueDescedants(() => parentRef))
    }
    return nonexhaustive(parentRef)
  }

  /**
   * Computes the scope for a given reference context.
   *
   * @param context - The reference information containing the context for which the scope is being computed.
   * @param referenceType - The type of reference being resolved. Defaults to the reference type derived from the context.
   * @returns A scope containing the relevant AST node descriptions for the given reference context.
   *
   * This method first checks if there are precomputed scopes available in the document. If not, it falls back to the global scope.
   * It then iterates through the container hierarchy, collecting relevant scopes based on the reference type and container type.
   * Finally, it combines the collected scopes with the global scope to produce the final scope.
   */
  protected computeScope(context: ReferenceInfo, referenceType = this.reflection.getReferenceType(context)) {
    const isElementReference = this.reflection.isSubtype(referenceType, ast.Element)
    const isDeploymentReference = this.reflection.isSubtype(referenceType, ast.DeploymentElement)

    const scopes: Stream<AstNodeDescription>[] = []
    const doc = getDocument(context.container)
    const precomputed = doc.precomputedScopes

    if (!precomputed) {
      return this.getGlobalScope(referenceType, context)
    }

    const byReferenceType = (desc: AstNodeDescription) => this.reflection.isSubtype(desc.type, referenceType)
    let container: AstNode | undefined = context.container
    while (container) {
      const elements = precomputed.get(container).filter(byReferenceType)
      if (elements.length > 0) {
        scopes.push(stream(elements))
      }
      if (isDeploymentReference && ast.isExtendDeploymentBody(container)) {
        scopes.push(this.getScopeExtendDeployment(container.$container))
      }
      if (isElementReference && ast.isExtendElementBody(container)) {
        scopes.push(this.getScopeExtendElement(container.$container))
      }
      if (isElementReference && ast.isElementViewBody(container)) {
        scopes.push(this.getScopeElementView(container.$container))
      }
      container = container.$container
    }

    return scopes.reduceRight((outerScope, elements) => {
      return this.createScope(elements, outerScope)
    }, this.getGlobalScope(referenceType, context))
  }
}
