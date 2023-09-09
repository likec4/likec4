import { InvalidModelError, invariant, isNonEmptyArray, nonexhaustive, type c4 } from '@likec4/core'
import type { AstNode, LangiumDocument } from 'langium'
import { DocumentState, getDocument, interruptAndCheck } from 'langium'
import objectHash from 'object-hash'
import stripIndent from 'strip-indent'
import { Disposable, type CancellationToken } from 'vscode-languageserver-protocol'
import type { LikeC4LangiumDocument, ParsedAstElement, ParsedAstElementView, ParsedAstRelation } from '../ast'
import {
  ElementViewOps,
  ast,
  cleanParsedModel,
  isLikeC4LangiumDocument,
  resolveRelationPoints,
  streamModel,
  toAutoLayout,
  toElementStyle,
  toElementStyleExcludeDefaults
} from '../ast'
import { elementRef, strictElementRefFqn } from '../elementRef'
import { logError, logWarnError, logger } from '../logger'
import type { LikeC4Services } from '../module'
import type { FqnIndex } from './fqn-index'
import { printDocs } from '../utils'

export type ModelParsedListener = () => void

export class LikeC4ModelParser {
  private fqnIndex: FqnIndex
  protected readonly listeners: ModelParsedListener[] = []

  constructor(private services: LikeC4Services) {
    this.fqnIndex = services.likec4.FqnIndex
    services.shared.workspace.DocumentBuilder.onBuildPhase(
      DocumentState.Validated,
      async (docs, cancelToken) => await this.onValidated(docs, cancelToken)
    )
  }

  public onParsed(callback: ModelParsedListener): Disposable {
    this.listeners.push(callback)
    return Disposable.create(() => {
      const index = this.listeners.indexOf(callback)
      if (index >= 0) {
        this.listeners.splice(index, 1)
      }
    })
  }

  protected async onValidated(docs: LangiumDocument[], cancelToken: CancellationToken): Promise<void> {
    let countOfChangedDocs = 0

    logger.debug(`[ModelParser] onValidated (${docs.length} docs)\n${printDocs(docs)}`)

    for (const doc of docs) {
      if (!isLikeC4LangiumDocument(doc)) {
        continue
      }
      countOfChangedDocs++
      try {
        await this.parseDocument(doc, cancelToken)
      } catch (cause) {
        logError(new InvalidModelError(`Error parsing document ${doc.uri.toString()}`, { cause }))
      }
    }
    if (countOfChangedDocs > 0) {
      this.notifyListeners()
    }
  }

  protected async parseDocument(doc: LikeC4LangiumDocument, cancelToken: CancellationToken) {
    const { elements, relations, views, specification } = cleanParsedModel(doc)

    const specs = doc.parseResult.value.specification?.specs.filter(ast.isSpecificationElementKind)
    if (specs) {
      for (const { kind, style } of specs) {
        if (kind.name in specification.kinds) {
          logger.warn(`Duplicate specification for kind ${kind.name}`)
          continue
        }
        try {
          specification.kinds[kind.name as c4.ElementKind] = toElementStyleExcludeDefaults(style?.props)
        } catch (e) {
          logWarnError(e)
        }
      }
    }

    await interruptAndCheck(cancelToken)

    for (const el of streamModel(doc)) {
      if (ast.isElement(el)) {
        try {
          elements.push(this.parseElement(el))
        } catch (e) {
          logWarnError(e)
        }
        continue
      }
      if (ast.isRelation(el)) {
        try {
          relations.push(this.parseRelation(el))
        } catch (e) {
          logWarnError(e)
        }
        continue
      }
      nonexhaustive(el)
    }

    await interruptAndCheck(cancelToken)

    const docviews = doc.parseResult.value.views?.views
    if (docviews) {
      for (const view of docviews) {
        try {
          const v = this.parseElementView(view)
          ElementViewOps.writeId(view, v.id)
          views.push(v)
        } catch (e) {
          logWarnError(e)
        }
      }
    }
    // const prevHash = doc.c4hash ?? ''
    // doc.c4hash = c4hash(doc)
    // return prevHash !== doc.c4hash
  }

  private parseElement(astNode: ast.Element): ParsedAstElement {
    const id = this.resolveFqn(astNode)
    invariant(astNode.kind.ref, 'Element kind is not resolved: ' + astNode.name)
    const kind = astNode.kind.ref.name as c4.ElementKind
    const tags = this.convertTags(astNode.body)
    const stylePropsAst = astNode.body?.props.find(ast.isStyleProperties)?.props
    const styleProps = toElementStyleExcludeDefaults(stylePropsAst)
    const astPath = this.getAstNodePath(astNode)

    let [title, description, technology] = astNode.props

    const bodyProps =
      astNode.body?.props.filter((p): p is ast.ElementStringProperty => ast.isElementStringProperty(p)) ?? []

    title = title ?? bodyProps.find(p => p.key === 'title')?.value
    description = description ?? bodyProps.find(p => p.key === 'description')?.value
    technology = technology ?? bodyProps.find(p => p.key === 'technology')?.value

    const links = astNode.body?.props.filter(ast.isLinkProperty).map(p => p.value)

    return {
      id,
      kind,
      astPath,
      title: title ? stripIndent(title).trim() : astNode.name,
      ...(tags && { tags }),
      ...(links && isNonEmptyArray(links) && { links }),
      ...(technology && { technology }),
      ...(description && { description: stripIndent(description).trim() }),
      ...styleProps
    }
  }

  private parseRelation(astNode: ast.Relation): ParsedAstRelation {
    const coupling = resolveRelationPoints(astNode)
    const target = this.resolveFqn(coupling.target)
    const source = this.resolveFqn(coupling.source)
    const hashdata = {
      astPath: this.getAstNodePath(astNode),
      source,
      target
    }
    const id = objectHash(hashdata) as c4.RelationID
    const title = astNode.title ?? astNode.body?.props.find(p => p.key === 'title')?.value ?? ''
    return {
      id,
      ...hashdata,
      title
    }
  }

  private parseElementExpression(astNode: ast.ElementExpression): c4.ElementExpression {
    if (ast.isWildcardExpression(astNode)) {
      return {
        wildcard: true
      }
    }
    if (ast.isElementKindExpression(astNode)) {
      invariant(astNode.kind.ref, 'ElementKindExpression kind is not resolved: ' + astNode.$cstNode?.text)
      return {
        elementKind: astNode.kind.ref.name as c4.ElementKind,
        isEqual: astNode.isEqual
      }
    }
    if (ast.isElementTagExpression(astNode)) {
      invariant(astNode.tag.ref, 'ElementTagExpression tag is not resolved: ' + astNode.$cstNode?.text)
      return {
        elementTag: astNode.tag.ref.name as c4.Tag,
        isEqual: astNode.isEqual
      }
    }
    if (ast.isElementRefExpression(astNode)) {
      const element = elementRef(astNode.id)
      invariant(element, 'Element not found ' + astNode.id.$cstNode?.text)
      return {
        element: this.resolveFqn(element),
        isDescedants: astNode.isDescedants
      }
    }
    nonexhaustive(astNode)
  }

  private parseExpression(astNode: ast.Expression): c4.Expression {
    if (ast.isElementExpression(astNode)) {
      return this.parseElementExpression(astNode)
    }
    if (ast.isIncomingExpression(astNode)) {
      return {
        incoming: this.parseElementExpression(astNode.target)
      }
    }
    if (ast.isOutgoingExpression(astNode)) {
      return {
        outgoing: this.parseElementExpression(astNode.source)
      }
    }
    if (ast.isInOutExpression(astNode)) {
      return {
        inout: this.parseElementExpression(astNode.inout.target)
      }
    }
    if (ast.isRelationExpression(astNode)) {
      return {
        source: this.parseElementExpression(astNode.source),
        target: this.parseElementExpression(astNode.target)
      }
    }
    nonexhaustive(astNode)
  }

  private parseViewRule(astRule: ast.ViewRule): c4.ViewRule {
    if (ast.isViewRuleExpression(astRule)) {
      const exprs = astRule.expressions.map(n => this.parseExpression(n))
      return {
        isInclude: astRule.isInclude,
        exprs
      }
    }
    if (ast.isViewRuleStyle(astRule)) {
      const styleProps = toElementStyle(astRule.props)
      return {
        targets: astRule.targets.map(n => this.parseElementExpression(n)),
        style: {
          ...styleProps
        }
      }
    }
    if (ast.isViewRuleAutoLayout(astRule)) {
      return {
        autoLayout: toAutoLayout(astRule.direction)
      }
    }
    nonexhaustive(astRule)
  }

  private parseElementView(astNode: ast.ElementView): ParsedAstElementView {
    const viewOfEl = astNode.viewOf && elementRef(astNode.viewOf)
    const viewOf = viewOfEl && this.resolveFqn(viewOfEl)
    const astPath = this.getAstNodePath(astNode)
    let id = astNode.name as c4.ViewID | undefined
    if (!id) {
      const doc = getDocument(astNode).uri.toString()
      id = objectHash({
        doc,
        astPath,
        viewOf: viewOf ?? null
      }) as c4.ViewID
    }

    const title = astNode.props.find(p => p.key === 'title')?.value
    const description = astNode.props.find(p => p.key === 'description')?.value

    const tags = this.convertTags(astNode)
    const links = astNode.props.filter(ast.isLinkProperty).map(p => p.value)

    return {
      id,
      astPath,
      ...(viewOf && { viewOf }),
      ...(title && { title }),
      ...(description && { description }),
      ...(tags && { tags }),
      ...(links && isNonEmptyArray(links) && { links }),
      rules: astNode.rules.flatMap(n => {
        try {
          return this.parseViewRule(n)
        } catch (e) {
          logWarnError(e)
          return []
        }
      })
    }
  }

  protected resolveFqn(node: ast.Element | ast.ExtendElement) {
    if (ast.isExtendElement(node)) {
      return strictElementRefFqn(node.element)
    }
    const fqn = this.fqnIndex.getFqn(node)
    invariant(fqn, `Not indexed element: ${this.getAstNodePath(node)}`)
    return fqn
  }

  private getAstNodePath(node: AstNode) {
    return this.services.workspace.AstNodeLocator.getAstNodePath(node)
  }

  private convertTags<E extends { tags?: ast.Tags }>(withTags?: E) {
    if (!withTags) {
      return null
    }
    const tags = withTags.tags?.value.flatMap(({ ref }) => (ref ? (ref.name as c4.Tag) : []))
    return tags && isNonEmptyArray(tags) ? tags : null
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (e) {
        logError(e)
      }
    }
  }
}
