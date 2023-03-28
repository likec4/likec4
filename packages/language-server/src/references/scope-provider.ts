import { DONE_RESULT, DefaultScopeProvider, EMPTY_SCOPE, StreamImpl, StreamScope, type AstNodeDescription, type ReferenceInfo, type Scope, type Stream, AstNode, getDocument, stream, EMPTY_STREAM } from 'langium'
import { ast } from '../ast'
import { elementRef, isElementRefHead, parentStrictElementRef, strictElementRefFqn } from '../elementRef'
import type { FqnIndex } from '../model/fqn-index'
import type { LikeC4Services } from '../module'
import invariant from 'tiny-invariant'
export class LikeC4ScopeProvider extends DefaultScopeProvider {

  private fqnIndex: FqnIndex

  constructor(services: LikeC4Services) {
    super(services)
    this.fqnIndex = services.likec4.FqnIndex
  }

  private scopeElementRef(ref: ast.ElementRef): Stream<AstNodeDescription> {
    const parentNode = ref.$container
    if (!ast.isElementRef(parentNode)) {
      throw new Error('Expected be inside ElementRef')
    }
    return new StreamImpl(
      () => {
        // if (ast.isElementRef(ref.$container))
        const parent = parentNode.el.ref
        const fqn = parent && this.fqnIndex.get(parent)
        if (fqn) {
          return this.fqnIndex.uniqueDescedants(fqn).iterator()
        }
        return null
      },
      (iterator) => {
        if (iterator) {
          return iterator.next()
        }
        return DONE_RESULT
      }
    )
  }

  private scopeElementView(ref: ast.ElementView): Stream<AstNodeDescription> {
    const viewOf = ref.of
    if (!viewOf) {
      return EMPTY_STREAM
    }
    return new StreamImpl(
      () => {
        // if (ast.isElementRef(ref.$container))
        const target = elementRef(viewOf)
        const fqn = target && this.fqnIndex.get(target)
        if (fqn) {
          return this.fqnIndex.uniqueDescedants(fqn).iterator()
        }
        return null
      },
      (iterator) => {
        if (iterator) {
          return iterator.next()
        }
        return DONE_RESULT
      }
    )
  }


  override getScope(context: ReferenceInfo): Scope {
    try {
      const referenceType = this.reflection.getReferenceType(context)
      const node = context.container
      // const path = this.services.workspace.AstNodeLocator.getAstNodePath(node)
      if (referenceType === ast.Element) {
        if (ast.isStrictElementRef(node)) {
          if (isElementRefHead(node)) {
            return this.getGlobalScope(referenceType)
          }
          const parent = parentStrictElementRef(node)
          return new StreamScope(this.fqnIndex.directChildrenOf(parent))
        }
        if (ast.isElementRef(node) && !isElementRefHead(node)) {
          return new StreamScope(this.scopeElementRef(node))
        }
      }
      return this.computeScope(node, referenceType)
    } catch (e) {
      console.error(e)
      // logger.error(e)
      return EMPTY_SCOPE
    }
  }

  protected computeScope(container: AstNode, referenceType: string) {
    const scopes: Array<Stream<AstNodeDescription>> = []
    const doc = getDocument(container)
    const precomputed = doc.precomputedScopes

    const byReferenceType = (desc: AstNodeDescription) =>
      this.reflection.isSubtype(desc.type, referenceType)

    if (precomputed) {
      let currentNode: AstNode | undefined = container
      while (currentNode) {
        const elements = precomputed.get(currentNode).filter(byReferenceType)
        if (elements.length > 0) {
          scopes.push(stream(elements))
        }
        if (referenceType === ast.Element) {
          if (ast.isExtendElement(currentNode) && currentNode !== container) {
            const extendsOf = strictElementRefFqn(currentNode.element)
            scopes.push(this.fqnIndex.uniqueDescedants(extendsOf))
          }
          if (ast.isElementView(currentNode) && currentNode !== container) {
            scopes.push(this.scopeElementView(currentNode))
          }
        }
        currentNode = currentNode.$container
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
