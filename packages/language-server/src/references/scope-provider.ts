import type * as c4 from '@likec4/core/types'
import type { AstNode } from 'langium'
import {
  DONE_RESULT,
  DefaultScopeProvider,
  EMPTY_STREAM,
  StreamImpl,
  StreamScope,
  getDocument,
  stream,
  type AstNodeDescription,
  type ReferenceInfo,
  type Scope,
  type Stream,
  findNodeForProperty,
  toDocumentSegment
} from 'langium'
import { ast } from '../ast'
import { elementRef, isElementRefHead, parentFqnElementRef } from '../elementRef'
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
    const parentNode = ref.$container
    if (!ast.isElementRef(parentNode)) {
      throw new Error('Expected be inside ElementRef')
    }
    return this.uniqueDescedants(() => parentNode.el.ref)
  }

  private scopeExtendElement(extend: ast.ExtendElement): Stream<AstNodeDescription> {
    return this.uniqueDescedants(() => elementRef(extend.element))
  }

  private scopeElementView({ viewOf, extends: ext }: ast.ElementView): Stream<AstNodeDescription> {
    if (ext) {
      return stream([ext]).flatMap(v => {
        const view = v.view.ref
        return view ? this.scopeElementView(view) : EMPTY_STREAM
      })
    }
    if (viewOf) {
      return this.uniqueDescedants(() => elementRef(viewOf))
    }
    return EMPTY_STREAM
  }

  override getScope(context: ReferenceInfo): Scope {
    const referenceType = this.reflection.getReferenceType(context)
    try {
      const container = context.container
      // const path = this.services.workspace.AstNodeLocator.getAstNodePath(node)
      if (referenceType === ast.Element) {
        if (ast.isStrictElementRef(container)) {
          if (isElementRefHead(container)) {
            return this.getGlobalScope(referenceType)
          }
          const parent = parentFqnElementRef(container)
          return new StreamScope(this.directChildrenOf(parent))
        }
        if (ast.isElementRef(container) && !isElementRefHead(container)) {
          return new StreamScope(this.scopeElementRef(container))
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

    const byReferenceType = (desc: AstNodeDescription) => this.reflection.isSubtype(desc.type, referenceType)

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
