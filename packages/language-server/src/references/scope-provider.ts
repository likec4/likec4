import { invariant } from '@likec4/core'
import type * as c4 from '@likec4/core'
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
import { ast } from '../ast'
import { elementRef, getFqnElementRef } from '../elementRef'
import { logger } from '../logger'
import type { FqnIndex } from '../model/fqn-index'
import type { LikeC4Services } from '../module'

const { getDocument } = AstUtils

export class LikeC4ScopeProvider extends DefaultScopeProvider {
  private fqnIndex: FqnIndex

  constructor(services: LikeC4Services) {
    super(services)
    this.fqnIndex = services.likec4.FqnIndex
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
      if (referenceType !== ast.Element) {
        return this.getGlobalScope(referenceType)
      }
      try {
        const container = context.container
        if (ast.isFqnElementRef(container) && context.property === 'el') {
          const parent = container.parent
          if (!parent) {
            return this.getGlobalScope(referenceType)
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
        return this.getGlobalScope(referenceType)
      }
    } catch (e) {
      logger.warn(e)
      return EMPTY_SCOPE
    }
  }

  protected computeScope(context: ReferenceInfo) {
    const referenceType = this.reflection.getReferenceType(context)
    // computeScope is called only for elements
    invariant(referenceType === ast.Element, 'Invalid reference type')
    const scopes: Stream<AstNodeDescription>[] = []
    const doc = getDocument(context.container)
    const precomputed = doc.precomputedScopes

    if (precomputed) {
      const byReferenceType = (desc: AstNodeDescription) => this.reflection.isSubtype(desc.type, referenceType)
      let container: AstNode | undefined = context.container
      while (container) {
        const elements = precomputed.get(container).filter(byReferenceType)
        if (elements.length > 0) {
          scopes.push(stream(elements))
        }

        if (ast.isExtendElementBody(container)) {
          scopes.push(this.scopeExtendElement(container.$container))
        }
        if (ast.isElementViewBody(container)) {
          scopes.push(this.scopeElementView(container.$container))
        }
        container = container.$container
      }
    }

    return scopes.reduceRight((outerScope, elements) => {
      return this.createScope(elements, outerScope)
    }, this.getGlobalScope(referenceType))
  }

  /**
   * Create a global scope filtered for the given reference type.
   */
  protected override getGlobalScope(referenceType: string): Scope {
    return new StreamScope(this.indexManager.allElements(referenceType))
  }
}
