import { invariant, isAnyOf, nonNullable } from '@likec4/core/utils'
import type { AstNode, CstNode, Properties } from 'langium'
import {
  type SemanticTokenAcceptor,
  AbstractSemanticTokenProvider,
} from 'langium/lsp'
import { isTruthy } from 'remeda'
import { SemanticTokenModifiers, SemanticTokenTypes } from 'vscode-languageserver-types'
import { ast } from '../ast'
import { logger } from '../logger'

type Predicate<T extends AstNode> = (x: unknown) => x is T
interface Highlighter<T extends AstNode> {
  /**
   * Current AST node being highlighted.
   */
  node: T
  /**
   * Highlight a CST node (or whole current AST node if no argument provided).
   */
  cst: (cstNode?: CstNode) => SemanticTypeMethods
  /**
   * Highlight a keyword within the current AST node.
   */
  keyword: (keyword: string) => SemanticTypeMethods
  /**
   * Highlight a property of the current AST node.
   */
  property: (property: Properties<T>, index?: number) => SemanticTypeMethods
}

type SemanticTypeMethods =
  & {
    [K in keyof typeof SemanticTokenTypes]: () => void
  }
  & {
    [M in keyof typeof SemanticTokenModifiers]: SemanticTypeMethods
  }
  & {
    modifier: (modifier: string) => SemanticTypeMethods
  }

const SemanticTypes = { ...SemanticTokenTypes }
const SemanticModifiers = { ...SemanticTokenModifiers }

function createSemanticTypeMethods(
  applyHighlight: (type: SemanticTokenTypes, modifier: SemanticTokenModifiers[]) => void,
): SemanticTypeMethods {
  const modifier = [] as SemanticTokenModifiers[]
  const self = new Proxy({} as SemanticTypeMethods, {
    get(_, prop: string) {
      if (prop === 'modifier') {
        return (mod: string) => {
          modifier.push(mod as SemanticTokenModifiers)
          return self
        }
      }
      if (prop in SemanticModifiers) {
        modifier.push(SemanticModifiers[prop as keyof typeof SemanticTokenModifiers])
        return self
      }
      if (prop in SemanticTypes) {
        return () => applyHighlight(SemanticTypes[prop as keyof typeof SemanticTokenTypes], modifier)
      }
      throw new Error(`Unknown semantic token type or modifier: ${prop}`)
    },
  })
  return self
}

const PRUNE = 'Stop Highlighting'
const stopHighlight = (): never => {
  throw PRUNE
}

export class LikeC4SemanticTokenProvider extends AbstractSemanticTokenProvider {
  protected override highlightElement(
    node: AstNode,
    acceptor: SemanticTokenAcceptor,
  ): void | undefined | 'prune' {
    try {
      if (isAnyOf(ast.isElement, ast.isDeploymentNode, ast.isDeployedInstance)(node)) {
        return this.highlightNameAndKind(node)
      }
      if (ast.isLikeC4View(node)) {
        return this.highlightView(node)
      }

      if (
        ast.isAnyProperty(node) &&
        !isAnyOf(
          ast.isMetadataProperty,
          ast.isElementStyleProperty,
          ast.isRelationStyleProperty,
        )(node)
      ) {
        invariant(node.key)
        acceptor({
          node,
          property: 'key',
          type: SemanticTokenTypes.property,
        })
      }

      this.when(node, ast.isRelationshipKind, mark => {
        mark.property('name').function()
      })

      this.when(node, isAnyOf(ast.isRelation, ast.isOutgoingRelationExpr, ast.isDeploymentRelation), mark => {
        mark.property('kind').function()
      })

      this.when(node, ast.isLibIcon, mark => {
        mark.property('name').definition.function()
        stopHighlight()
      })

      this.when(node, isAnyOf(ast.isNavigateToProperty, ast.isRelationNavigateToProperty), mark => {
        mark.property('value').readonly.definition.interface()
        stopHighlight()
      })
      this.when(node, isAnyOf(ast.isFqnRefExpr, ast.isWildcardExpression), mark => {
        mark.cst().readonly.definition.variable()
        stopHighlight()
      })
      this.when(node, ast.isTagRef, mark => {
        mark.cst().type()
        stopHighlight()
      })
      this.when(node, ast.isRelationKindDotRef, mark => {
        mark.cst().function()
        stopHighlight()
      })

      this.when(node, ast.isWhereRelationKind, mark => {
        if (isTruthy(mark.node.value)) {
          mark.property('value').function()
        }
      })
      this.when(node, isAnyOf(ast.isWhereElement, ast.isWhereRelation), mark => {
        if (isTruthy(mark.node.value)) {
          mark.property('value').readonly.definition.type()
        }
      })
      this.when(node, isAnyOf(ast.isWhereRelationParticipantKind, ast.isWhereRelationParticipantTag), mark => {
        mark.property('participant').keyword()
      })
      this.when(node, ast.isElementKindExpression, mark => {
        if (isTruthy(mark.node.kind)) {
          mark.property('kind').definition.type()
        }
      })
      this.when(node, isAnyOf(ast.isGlobalStyleGroup, ast.isGlobalStyle), mark => {
        mark.property('id').readonly.definition.variable()
      })
      this.when(node, ast.isViewRuleGlobalStyle, mark => {
        mark.property('style').readonly.definition.variable()
      })
      this.when(node, isAnyOf(ast.isGlobalPredicateGroup, ast.isGlobalDynamicPredicateGroup), mark => {
        mark.property('name').readonly.definition.variable()
      })
      this.when(node, ast.isViewRuleGlobalPredicateRef, mark => {
        mark.property('predicate').readonly.definition.variable()
      })
      this.when(node, ast.isElementTagExpression, mark => {
        if (isTruthy(mark.node.tag)) {
          mark.property('tag').definition.type()
        }
      })
      this.when(node, isAnyOf(ast.isFqnRef, ast.isStrictFqnRef), mark => {
        mark.property('value').readonly.definition.variable()
        if (!mark.node.parent) {
          stopHighlight()
        }
      })
      this.when(node, ast.isStrictFqnElementRef, mark => {
        mark.property('el').readonly.definition.variable()
        if (!mark.node.parent) {
          stopHighlight()
        }
      })
      this.when(node, ast.isSpecificationColor, mark => {
        mark.keyword('color').keyword()
        mark.property('name').readonly.declaration.type()
      })
      this.when(node, ast.isSpecificationTag, mark => {
        if (isTruthy(mark.node.color)) {
          mark.keyword('color').property()
        }
      })
      this.when(
        node,
        isAnyOf(
          ast.isSpecificationElementKind,
          ast.isSpecificationRelationshipKind,
          ast.isSpecificationDeploymentNodeKind,
        ),
        mark => {
          mark.property('kind').readonly.declaration.type()
        },
      )
      this.when(node, ast.isTag, mark => {
        mark.property('name').definition.type()
      })
      this.when(node, ast.isOpacityProperty, mark => {
        mark.property('value').number()
      })
      this.when(node, ast.isIconProperty, mark => {
        if (mark.node.libicon || mark.node.value === 'none') {
          mark.property(mark.node.libicon ? 'libicon' : 'value').defaultLibrary.enum()
          return
        }
        mark.property('value').string()
      })
      this.when(node, ast.isLinkProperty, mark => {
        if (isTruthy(mark.node.value)) {
          mark.property('value').string()
        }
      })
      this.when(node, ast.isColorProperty, mark => {
        if (isTruthy(mark.node.customColor)) {
          mark.property('customColor').enum()
        }
        if (isTruthy(mark.node.themeColor)) {
          mark.property('themeColor').enum()
        }
      })
      this.when(
        node,
        isAnyOf(
          ast.isShapeProperty,
          ast.isArrowProperty,
          ast.isLineProperty,
          ast.isBorderProperty,
          ast.isSizeProperty,
          ast.isDynamicViewDisplayVariantProperty,
        ),
        mark => {
          if (isTruthy(mark.node.value)) {
            mark.property('value').enum()
          }
        },
      )
    } catch (error) {
      if (error === PRUNE) {
        return 'prune'
      }
      logger.warn(`Error highlighting node of type ${(node as any)._type}`, { error })
    }
  }

  private highlightNameAndKind(
    node: ast.Element | ast.DeploymentNode | ast.DeployedInstance,
  ) {
    const mark = this.mark(node)
    mark.property('name').declaration.readonly.variable()
    if (!ast.isDeployedInstance(node)) {
      this.mark(node).property('kind').keyword()
    }
    if (ast.isElement(node)) {
      if (node.props.length > 0) {
        this.mark(node).property('props').string()
      }
      return
    }
    // This is DeploymentNode
    if (node.title) {
      this.mark(node).property('title').string()
    }
  }

  private highlightView(node: ast.LikeC4View) {
    if (node.name) {
      const mark = this.mark(node)
      mark.property('name')
        .modifier('local')
        .declaration
        .readonly
        .interface()
    }
  }

  private when<T extends AstNode>(
    node: AstNode,
    predicate: Predicate<T>,
    highlightFn: (highlight: Highlighter<T>) => void,
  ): void {
    if (!predicate(node)) {
      return
    }
    highlightFn(this.mark<T>(node))
  }

  private mark<T extends AstNode>(node: T): Highlighter<T> {
    const cst = (cstNode?: CstNode): SemanticTypeMethods => {
      return createSemanticTypeMethods((type, modifier) =>
        this.highlightToken({
          range: nonNullable(cstNode ?? node.$cstNode, 'AST node has no CST node').range,
          type,
          modifier,
        })
      )
    }

    const keyword = (keyword: string): SemanticTypeMethods => {
      return createSemanticTypeMethods((type, modifier) =>
        this.highlightKeyword({
          node,
          keyword,
          type,
          modifier,
        })
      )
    }
    const property = (property: Properties<T>, index?: number): SemanticTypeMethods => {
      return createSemanticTypeMethods((type, modifier) =>
        this.highlightProperty({
          node,
          property,
          type,
          modifier,
          ...(index !== undefined ? { index } : {}),
        })
      )
    }

    return {
      node,
      cst,
      keyword,
      property,
    }
  }
}
