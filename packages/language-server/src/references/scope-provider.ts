import type { AstNode} from 'langium';
import { DONE_RESULT, DefaultScopeProvider, EMPTY_SCOPE, StreamImpl, StreamScope, type AstNodeDescription, type ReferenceInfo, type Scope, type Stream, getDocument, stream, EMPTY_STREAM } from 'langium'
import { ast } from '../ast'
import { elementRef, isElementRefHead, parentStrictElementRef, strictElementRefFqn } from '../elementRef'
import type { FqnIndex } from '../model/fqn-index'
import type { LikeC4Services } from '../module'

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

  private scopeElementView({ viewOf }: ast.ElementView): Stream<AstNodeDescription> {
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
          if (ast.isExtendElement(container) && node.$container !== container) {
            const extendsOf = strictElementRefFqn(container.element)
            scopes.push(this.fqnIndex.uniqueDescedants(extendsOf))
          }
          if (ast.isElementView(container) && node.$container !== container) {
            scopes.push(this.scopeElementView(container))
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
