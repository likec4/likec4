import type * as c4 from '@likec4/core'
import { nonexhaustive } from '@likec4/core'
import type { AstNode } from 'langium'
import {
  type AstNodeDescription,
  AstUtils,
  DefaultScopeProvider,
  DONE_RESULT,
  EMPTY_SCOPE,
  EMPTY_STREAM,
  MapScope,
  type ReferenceInfo,
  type Scope,
  type Stream,
  stream,
  StreamImpl,
  StreamScope
} from 'langium'
import { ast, isLikeC4LangiumDocument } from '../ast'
import { logger } from '../logger'
import type { DeploymentsIndex, FqnIndex } from '../model'
import type { LikeC4Services } from '../module'
import { elementRef, getFqnElementRef } from '../utils/elementRef'

const { getDocument } = AstUtils

export class LikeC4ScopeProvider extends DefaultScopeProvider {
  private deploymentsIndex: DeploymentsIndex
  private fqnIndex: FqnIndex

  constructor(services: LikeC4Services) {
    super(services)
    this.fqnIndex = services.likec4.FqnIndex
    this.deploymentsIndex = services.likec4.DeploymentsIndex
  }

  private directChildrenOf(parent: c4.Fqn): Stream<AstNodeDescription> {
    return this.fqnIndex.directChildrenOf(parent)
  }

  // we need lazy resolving here
  private uniqueDescedants(of: () => ast.Element | undefined): Stream<AstNodeDescription> {
    return new StreamImpl(
      () => {
        const element = of()
        const fqn = element && this.fqnIndex.getFqn(element)
        if (fqn) {
          return this.fqnIndex.uniqueDescedants(fqn).iterator()
        }
        return null
      },
      iterator => {
        if (iterator) {
          return iterator.next()
        }
        return DONE_RESULT
      }
    )
  }

  private scopeElementRef(ref: ast.ElementRef): Stream<AstNodeDescription> {
    return this.uniqueDescedants(() => ref.el.ref)
  }

  private scopeExtendElement({ element }: ast.ExtendElement): Stream<AstNodeDescription> {
    // we make extended element resolvable inside ExtendElementBody
    return stream([element.el.$nodeDescription])
      .nonNullable()
      .concat(this.uniqueDescedants(() => elementRef(element)))
  }

  private scopeElementView({ viewOf, extends: ext }: ast.ElementView): Stream<AstNodeDescription> {
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
        return view ? this.scopeElementView(view) : EMPTY_STREAM
      })
    }
    return EMPTY_STREAM
  }

  override getScope(context: ReferenceInfo): Scope {
    try {
      const referenceType = this.reflection.getReferenceType(context)
      try {
        const container = context.container
        if (ast.isDeploymentRef(container)) {
          return this.getScopeForDeploymentRef(container, context)
        }

        if (referenceType !== ast.Element) {
          return this.getGlobalScope(referenceType, context)
        }

        if (ast.isFqnElementRef(container) && context.property === 'el') {
          const parent = container.parent
          if (!parent) {
            return this.getGlobalScope(referenceType, context)
          }
          return new StreamScope(this.directChildrenOf(getFqnElementRef(parent)))
        }
        if (ast.isElementRef(container) && context.property === 'el') {
          const parent = container.parent
          if (parent) {
            return new StreamScope(this.scopeElementRef(parent))
          }
          // if we have elementRef "this" or "it" we resolve it to the closest element
          if (context.reference.$refText === 'this' || context.reference.$refText === 'it') {
            const closestElement = AstUtils.getContainerOfType(container, ast.isElement)
            if (closestElement) {
              return new MapScope([
                this.descriptions.createDescription(closestElement, context.reference.$refText)
              ])
            } else {
              return EMPTY_SCOPE
            }
          }
        }
        return this.computeScope(context)
      } catch (e) {
        logger.warn(e)
        return this.getGlobalScope(referenceType, context)
      }
    } catch (e) {
      logger.warn(e)
      return EMPTY_SCOPE
    }
  }

  protected getScopeForDeploymentRef(container: ast.DeploymentRef, context: ReferenceInfo) {
    const parent = container.parent
    if (!parent) {
      return new MapScope(
        // First preference for deployment nodes
        this.computeScope(context, ast.DeploymentNode).getAllElements(),
        // Second preference for deployed instances
        this.computeScope(context, ast.DeployedInstance)
      )
    }
    const parentRef = parent.value.ref
    if (!parentRef) {
      return EMPTY_SCOPE
    }
    if (ast.isDeploymentNode(parentRef)) {
      return new StreamScope(this.deploymentsIndex.nested(parentRef))
    }
    if (ast.isDeployedInstance(parentRef)) {
      return new StreamScope(this.scopeElementRef(parentRef.element))
    }
    if (ast.isElement(parentRef)) {
      return new StreamScope(this.uniqueDescedants(() => parentRef))
    }
    return nonexhaustive(parentRef)
  }

  protected computeScope(context: ReferenceInfo, referenceType = this.reflection.getReferenceType(context)) {
    const isElementReference = this.reflection.isSubtype(referenceType, ast.Element)

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

      if (isElementReference && ast.isExtendElementBody(container)) {
        scopes.push(this.scopeExtendElement(container.$container))
      }
      if (isElementReference && ast.isElementViewBody(container)) {
        scopes.push(this.scopeElementView(container.$container))
      }
      container = container.$container
    }

    return scopes.reduceRight((outerScope, elements) => {
      return this.createScope(elements, outerScope)
    }, this.getGlobalScope(referenceType, context))
  }
}
