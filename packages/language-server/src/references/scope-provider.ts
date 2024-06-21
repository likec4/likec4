import type { likec4 as c4 } from '@likec4/core'
import type { AstNode } from 'langium'
import {
  type AstNodeDescription,
  AstUtils,
  CstUtils,
  DefaultScopeProvider,
  DONE_RESULT,
  EMPTY_SCOPE,
  EMPTY_STREAM,
  GrammarUtils,
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
import type { FqnIndex, FqnIndexEntry } from '../model/fqn-index'
import type { LikeC4Services } from '../module'

const { findNodeForProperty } = GrammarUtils
const { toDocumentSegment } = CstUtils
const { getDocument } = AstUtils

function toAstNodeDescription(entry: FqnIndexEntry): AstNodeDescription {
  const $cstNode = findNodeForProperty(entry.el.$cstNode, 'name')
  return {
    documentUri: entry.doc.uri,
    name: entry.name,
    ...(entry.el.$cstNode && {
      selectionSegment: toDocumentSegment(entry.el.$cstNode)
    }),
    ...($cstNode && {
      nameSegment: toDocumentSegment($cstNode)
    }),
    path: entry.path,
    type: ast.Element
  }
}

export class LikeC4ScopeProvider extends DefaultScopeProvider {
  private fqnIndex: FqnIndex

  constructor(services: LikeC4Services) {
    super(services)
    this.fqnIndex = services.likec4.FqnIndex
  }

  private directChildrenOf(parent: c4.Fqn): Stream<AstNodeDescription> {
    return this.fqnIndex.directChildrenOf(parent).map(toAstNodeDescription)
  }

  // we need lazy resolving here
  private uniqueDescedants(of: () => ast.Element | undefined): Stream<AstNodeDescription> {
    return new StreamImpl(
      () => {
        const element = of()
        const fqn = element && this.fqnIndex.getFqn(element)
        if (fqn) {
          return this.fqnIndex.uniqueDescedants(fqn).map(toAstNodeDescription).iterator()
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
        }
        return this.computeScope(context)
      } catch (e) {
        logger.error(e)
        return this.getGlobalScope(referenceType)
      }
    } catch (e) {
      logger.warn(e)
      return EMPTY_SCOPE
    }
  }

  protected computeScope(context: ReferenceInfo) {
    const referenceType = this.reflection.getReferenceType(context)
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
        if (referenceType === ast.Element) {
          if (ast.isExtendElementBody(container)) {
            scopes.push(this.scopeExtendElement(container.$container))
          }
          if (ast.isElementViewBody(container)) {
            scopes.push(this.scopeElementView(container.$container))
          }
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
