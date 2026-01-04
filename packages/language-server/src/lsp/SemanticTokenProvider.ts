import { isAnyOf, nonNullable } from '@likec4/core/utils'
import { type AstNode, type CstNode, type LangiumDocument, type Properties, DocumentState } from 'langium'
import {
  type SemanticTokenAcceptor,
  AbstractSemanticTokenProvider,
} from 'langium/lsp'
import { isTruthy } from 'remeda'
import {
  type SemanticTokensDeltaParams,
  type SemanticTokensParams,
  type SemanticTokensRangeParams,
  CancellationToken,
} from 'vscode-languageserver-protocol'
import {
  type SemanticTokens,
  type SemanticTokensDelta,
  SemanticTokenModifiers,
  SemanticTokenTypes,
} from 'vscode-languageserver-types'
import { ast } from '../ast'
import { logger as rootLogger } from '../logger'
import type { LikeC4Services } from '../module'

const logger = rootLogger.getChild('SemanticTokenProvider')

type Predicate<T extends AstNode> = (x: unknown) => x is T
type Highlighter<T extends AstNode> = {
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
/**
 * Used to stop further highlighting for the current node (processing of its children
 */
const stopHighlight = (): never => {
  throw PRUNE
}

type Rule<T extends AstNode> = {
  predicate: Predicate<T>
  highlightFn: (highlight: Highlighter<T>) => void
}

export class LikeC4SemanticTokenProvider extends AbstractSemanticTokenProvider {
  private rules = [] as Rule<AstNode>[]

  constructor(protected services: LikeC4Services) {
    super(services)
    this.initRules()
  }

  protected initRules(): void {
    this.rules = []

    const when = <T extends AstNode>(
      predicate: Predicate<T>,
      highlightFn: (highlight: Highlighter<T>) => void,
    ): void => {
      const rule: Rule<T> = { predicate, highlightFn }
      this.rules.push(rule as unknown as Rule<AstNode>)
    }

    when(ast.isRelationshipKind, mark => {
      mark.property('name').function()
    })

    when(isAnyOf(ast.isRelation, ast.isOutgoingRelationExpr, ast.isDeploymentRelation), mark => {
      mark.property('kind').function()
    })

    when(ast.isLibIcon, mark => {
      mark.property('name').definition.function()
      stopHighlight()
    })

    when(isAnyOf(ast.isNavigateToProperty, ast.isRelationNavigateToProperty), mark => {
      mark.property('value').readonly.definition.interface()
      stopHighlight()
    })
    when(ast.isWildcardExpression, mark => {
      mark.cst().readonly.definition.variable()
      stopHighlight()
    })
    when(ast.isFqnRefExpr, mark => {
      if (!mark.node.selector) {
        return
      }
      if (mark.node.ref.parent) {
        mark.property('selector').property()
      } else {
        mark.property('selector').readonly.definition.variable()
      }
    })
    when(ast.isTagRef, mark => {
      mark.cst().type()
      stopHighlight()
    })
    when(ast.isRelationKindDotRef, mark => {
      mark.cst().function()
      stopHighlight()
    })

    when(ast.isWhereRelationKind, mark => {
      if (isTruthy(mark.node.value)) {
        mark.property('value').function()
      }
    })
    when(isAnyOf(ast.isWhereElement, ast.isWhereRelation), mark => {
      if (isTruthy(mark.node.value)) {
        mark.property('value').readonly.definition.type()
      }
    })
    when(isAnyOf(ast.isWhereRelationParticipantKind, ast.isWhereRelationParticipantTag), mark => {
      mark.property('participant').keyword()
    })
    when(ast.isElementKindExpression, mark => {
      if (isTruthy(mark.node.kind)) {
        mark.property('kind').definition.type()
      }
    })
    when(isAnyOf(ast.isGlobalStyleGroup, ast.isGlobalStyle), mark => {
      mark.property('id').readonly.definition.variable()
    })
    when(ast.isViewRuleGlobalStyle, mark => {
      mark.property('style').readonly.definition.variable()
    })
    when(isAnyOf(ast.isGlobalPredicateGroup, ast.isGlobalDynamicPredicateGroup), mark => {
      mark.property('name').readonly.definition.variable()
    })
    when(ast.isViewRuleGlobalPredicateRef, mark => {
      mark.property('predicate').readonly.definition.variable()
    })
    when(ast.isElementTagExpression, mark => {
      if (isTruthy(mark.node.tag)) {
        mark.property('tag').definition.type()
      }
    })
    when(isAnyOf(ast.isFqnRef, ast.isStrictFqnRef), mark => {
      if (!mark.node.parent) {
        mark.property('value').readonly.definition.variable()
        stopHighlight()
      } else {
        mark.property('value').property()
      }
    })
    when(ast.isStrictFqnElementRef, mark => {
      if (!mark.node.parent) {
        mark.property('el').readonly.definition.variable()
        stopHighlight()
      } else {
        mark.property('el').property()
      }
    })
    when(ast.isSpecificationColor, mark => {
      mark.keyword('color').keyword()
      mark.property('name').readonly.declaration.type()
    })
    when(ast.isSpecificationTag, mark => {
      if (isTruthy(mark.node.color)) {
        mark.keyword('color').property()
      }
    })
    when(
      isAnyOf(
        ast.isSpecificationElementKind,
        ast.isSpecificationRelationshipKind,
        ast.isSpecificationDeploymentNodeKind,
      ),
      mark => {
        mark.property('kind').readonly.declaration.type()
      },
    )
    when(ast.isTag, mark => {
      mark.property('name').definition.type()
    })
    when(ast.isOpacityProperty, mark => {
      mark.property('value').number()
    })
    when(ast.isIconProperty, mark => {
      if (mark.node.libicon || mark.node.value === 'none') {
        mark.property(mark.node.libicon ? 'libicon' : 'value').defaultLibrary.enum()
        return
      }
      mark.property('value').string()
    })
    when(ast.isLinkProperty, mark => {
      if (isTruthy(mark.node.value)) {
        mark.property('value').string()
      }
    })
    when(ast.isColorProperty, mark => {
      if (isTruthy(mark.node.customColor)) {
        mark.property('customColor').enum()
      }
      if (isTruthy(mark.node.themeColor)) {
        mark.property('themeColor').enum()
      }
    })
    when(
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
  }

  override async semanticHighlight(
    document: LangiumDocument,
    params: SemanticTokensParams,
    cancelToken = CancellationToken.None,
  ): Promise<SemanticTokens> {
    if (document.state < DocumentState.Linked) {
      await this.ensureState(document, cancelToken)
    }
    return await super.semanticHighlight(document, params, cancelToken)
  }

  override async semanticHighlightRange(
    document: LangiumDocument,
    params: SemanticTokensRangeParams,
    cancelToken = CancellationToken.None,
  ): Promise<SemanticTokens> {
    if (document.state < DocumentState.Linked) {
      await this.ensureState(document, cancelToken)
    }
    return await super.semanticHighlightRange(document, params, cancelToken)
  }

  override async semanticHighlightDelta(
    document: LangiumDocument,
    params: SemanticTokensDeltaParams,
    cancelToken = CancellationToken.None,
  ): Promise<SemanticTokens | SemanticTokensDelta> {
    if (document.state < DocumentState.Linked) {
      await this.ensureState(document, cancelToken)
    }
    return await super.semanticHighlightDelta(document, params, cancelToken)
  }

  protected async ensureState(
    document: LangiumDocument,
    cancelToken: CancellationToken,
  ): Promise<void> {
    if (document.state < DocumentState.Linked) {
      logger.debug`waiting for document ${document.uri.path} to be ${'Linked'}`
      await this.services.shared.workspace.DocumentBuilder.waitUntil(DocumentState.Linked, document.uri, cancelToken)
      logger.debug`document ${document.uri.path} is ${'Linked'}`
    }
  }

  protected override highlightElement(
    node: AstNode,
    acceptor: SemanticTokenAcceptor,
  ): void | undefined | 'prune' {
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
      )(node) &&
      isTruthy(node.key)
    ) {
      acceptor({
        node,
        property: 'key',
        type: SemanticTokenTypes.property,
      })
    }

    let m: Highlighter<AstNode>
    for (const { predicate, highlightFn } of this.rules) {
      if (predicate(node)) {
        try {
          m ??= this.mark(node)
          highlightFn(m)
        } catch (error) {
          if (error === PRUNE) {
            return 'prune'
          }
          logger.warn(`Error highlighting node of type ${(node as any)._type}`, { error })
        }
      }
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
