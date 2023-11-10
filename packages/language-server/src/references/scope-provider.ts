import type { likec4 as c4 } from '@likec4/core'
import type { AstNode } from 'langium'
import {
  DONE_RESULT,
  DefaultScopeProvider,
  EMPTY_STREAM,
  StreamImpl,
  StreamScope,
  findNodeForProperty,
  getDocument,
  stream,
  toDocumentSegment,
  type AstNodeDescription,
  type ReferenceInfo,
  type Scope,
  type Stream
} from 'langium'
import { ast } from '../ast'
import { elementRef, getFqnElementRef } from '../elementRef'
import { logError } from '../logger'
import type { FqnIndex, FqnIndexEntry } from '../model/fqn-index'
import type { LikeC4Services } from '../module'

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

  private scopeExtendElement(extend: ast.ExtendElement): Stream<AstNodeDescription> {
    return this.uniqueDescedants(() => elementRef(extend.element))
  }

  private scopeElementView({ viewOf, extends: ext }: ast.ElementView): Stream<AstNodeDescription> {
    if (viewOf) {
      // If we have "view of parent.target"
      // we make "target" resolvable inside ElementView
      return stream([viewOf])
        .flatMap(v => {
          const el = elementRef(v)
          return el ? this.descriptions.createDescription(el, el.name) : []
        })
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
      return this.computeScope(container, referenceType)
    } catch (e) {
      logError(e)
      return this.getGlobalScope(referenceType)
    }
  }

  protected computeScope(node: AstNode, referenceType: string) {
    const scopes: Stream<AstNodeDescription>[] = []
    const doc = getDocument(node)
    const precomputed = doc.precomputedScopes

    const byReferenceType = (desc: AstNodeDescription) =>
      this.reflection.isSubtype(desc.type, referenceType)

    if (precomputed) {
      const elements = precomputed.get(node).filter(byReferenceType)
      if (elements.length > 0) {
        scopes.push(stream(elements))
      }

      let container = node.$container
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
