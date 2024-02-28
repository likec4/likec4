import { type c4, InvalidModelError, invariant, isNonEmptyArray, nonexhaustive } from '@likec4/core'
import type { AstNode, LangiumDocument } from 'langium'
import { getDocument } from 'langium'
import { isTruthy } from 'remeda'
import stripIndent from 'strip-indent'
import type {
  FqnIndexedDocument,
  ParsedAstElement,
  ParsedAstElementView,
  ParsedAstRelation,
  ParsedLikeC4LangiumDocument
} from '../ast'
import {
  ast,
  checksFromDiagnostics,
  cleanParsedModel,
  ElementViewOps,
  isFqnIndexedDocument,
  resolveRelationPoints,
  streamModel,
  toAutoLayout,
  toElementStyle,
  toElementStyleExcludeDefaults,
  toRelationshipStyleExcludeDefaults
} from '../ast'
import { elementRef, getFqnElementRef } from '../elementRef'
import { logError, logger, logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import { stringHash } from '../utils'
import type { FqnIndex } from './fqn-index'

export type ModelParsedListener = () => void

function toSingleLine<T extends string | undefined>(str: T): T {
  return (str ? removeIndent(str).split('\n').join(' ') : undefined) as T
}

function removeIndent<T extends string | undefined>(str: T): T {
  return (str ? stripIndent(str).trim() : undefined) as T
}

export class LikeC4ModelParser {
  private fqnIndex: FqnIndex
  constructor(private services: LikeC4Services) {
    this.fqnIndex = services.likec4.FqnIndex
    logger.debug(`[ModelParser] Created`)
  }

  parse(doc: LangiumDocument | LangiumDocument[]): ParsedLikeC4LangiumDocument[] {
    const docs = Array.isArray(doc) ? doc : [doc]
    const result = [] as ParsedLikeC4LangiumDocument[]
    for (const doc of docs) {
      if (!isFqnIndexedDocument(doc)) {
        logger.warn(`Not a FqnIndexedDocument: ${doc.uri.toString(true)}`)
        continue
      }
      try {
        result.push(this.parseLikeC4Document(doc))
      } catch (cause) {
        logError(new InvalidModelError(`Error parsing document ${doc.uri.toString()}`, { cause }))
      }
    }
    return result
  }

  protected parseLikeC4Document(_doc: FqnIndexedDocument) {
    const doc = cleanParsedModel(_doc)
    this.parseSpecification(doc)
    this.parseModel(doc)
    this.parseViews(doc)
    return doc
    // const prevHash = doc.c4hash ?? ''
    // doc.c4hash = c4hash(doc)
    // return prevHash !== doc.c4hash
  }

  private parseSpecification(doc: ParsedLikeC4LangiumDocument) {
    const { isValid } = checksFromDiagnostics(doc)
    const { parseResult, c4Specification } = doc

    const specifications = parseResult.value.specifications.filter(isValid)
    const element_specs = specifications.flatMap(s => s.elements.filter(isValid))
    for (const { kind, style } of element_specs) {
      try {
        const kindName = kind.name as c4.ElementKind
        c4Specification.kinds[kindName] = {
          ...c4Specification.kinds[kindName],
          ...toElementStyleExcludeDefaults(style?.props)
        }
      } catch (e) {
        logWarnError(e)
      }
    }

    const relations_specs = specifications.flatMap(s => s.relationships.filter(isValid))
    for (const { kind, props } of relations_specs) {
      try {
        const kindName = kind.name as c4.RelationshipKind
        c4Specification.relationships[kindName] = {
          ...c4Specification.relationships[kindName],
          ...toRelationshipStyleExcludeDefaults(props)
        }
      } catch (e) {
        logWarnError(e)
      }
    }
  }

  private parseModel(doc: ParsedLikeC4LangiumDocument) {
    for (const el of streamModel(doc)) {
      if (ast.isElement(el)) {
        try {
          doc.c4Elements.push(this.parseElement(el))
        } catch (e) {
          logWarnError(e)
        }
        continue
      }
      if (ast.isRelation(el)) {
        try {
          doc.c4Relations.push(this.parseRelation(el))
        } catch (e) {
          logWarnError(e)
        }
        continue
      }
      nonexhaustive(el)
    }
  }

  private parseElement(astNode: ast.Element): ParsedAstElement {
    const id = this.resolveFqn(astNode)
    const kind = astNode.kind.$refText as c4.ElementKind
    const tags = this.convertTags(astNode.body)
    const stylePropsAst = astNode.body?.props.find(ast.isStyleProperties)?.props
    const styleProps = toElementStyleExcludeDefaults(stylePropsAst)
    const astPath = this.getAstNodePath(astNode)

    let [title, description, technology] = astNode.props

    const bodyProps = astNode.body?.props.filter(ast.isElementStringProperty) ?? []

    title = toSingleLine(title ?? bodyProps.find(p => p.key === 'title')?.value)
    description = removeIndent(description ?? bodyProps.find(p => p.key === 'description')?.value)
    technology = toSingleLine(technology ?? bodyProps.find(p => p.key === 'technology')?.value)

    const links = astNode.body?.props.filter(ast.isLinkProperty).map(p => p.value)

    return {
      id,
      kind,
      astPath,
      title: title ?? astNode.name,
      ...(tags && { tags }),
      ...(links && isNonEmptyArray(links) && { links }),
      ...(isTruthy(technology) && { technology }),
      ...(isTruthy(description) && { description }),
      ...styleProps
    }
  }

  private parseRelation(astNode: ast.Relation): ParsedAstRelation {
    const coupling = resolveRelationPoints(astNode)
    const target = this.resolveFqn(coupling.target)
    const source = this.resolveFqn(coupling.source)
    const tags = this.convertTags(astNode) ?? this.convertTags(astNode.body)
    const kind = astNode.kind?.ref?.name as c4.RelationshipKind
    const astPath = this.getAstNodePath(astNode)
    const title = toSingleLine(
      astNode.title ?? astNode.body?.props.find((p): p is ast.RelationStringProperty => p.key === 'title')?.value
    ) ?? ''
    const styleProp = astNode.body?.props.find(ast.isRelationStyleProperty)
    const id = stringHash(
      astPath,
      source,
      target
    ) as c4.RelationID
    return {
      id,
      astPath,
      source,
      target,
      title,
      ...(kind && { kind }),
      ...(tags && { tags }),
      ...toRelationshipStyleExcludeDefaults(styleProp?.props)
    }
  }

  private parseViews(doc: ParsedLikeC4LangiumDocument) {
    const { isValid } = checksFromDiagnostics(doc)
    const views = doc.parseResult.value.views.flatMap(v => isValid(v) ? v.views.filter(isValid) : [])
    for (const view of views) {
      try {
        const v = this.parseElementView(view)
        doc.c4Views.push(v)
      } catch (e) {
        logWarnError(e)
      }
    }
  }

  private parseElementExpr(astNode: ast.ElementExpr): c4.ElementExpression {
    if (ast.isWildcardExpr(astNode)) {
      return {
        wildcard: true
      }
    }
    if (ast.isElementKindExpr(astNode)) {
      // invariant(astNode.kind.ref, 'ElementKindExpr kind is not resolved: ' + astNode.$cstNode?.text)
      return {
        elementKind: astNode.kind.$refText as c4.ElementKind,
        isEqual: astNode.isEqual
      }
    }
    if (ast.isElementTagExpr(astNode)) {
      let elementTag = astNode.tag.$refText
      if (elementTag.startsWith('#')) {
        elementTag = elementTag.slice(1)
      }
      // invariant(astNode.tag.ref, 'ElementTagExpr tag is not resolved: ' + astNode.$cstNode?.text)
      return {
        elementTag: elementTag as c4.Tag,
        isEqual: astNode.isEqual
      }
    }
    if (ast.isDescedantsExpr(astNode)) {
      const elementNode = elementRef(astNode.parent)
      invariant(elementNode, 'Element not found ' + astNode.parent.$cstNode?.text)
      const element = this.resolveFqn(elementNode)
      return {
        element,
        isDescedants: true
      }
    }
    if (ast.isElementRef(astNode)) {
      const elementNode = elementRef(astNode)
      invariant(elementNode, 'Element not found ' + astNode.$cstNode?.text)
      const element = this.resolveFqn(elementNode)
      return {
        element
      }
    }
    nonexhaustive(astNode)
  }

  private parseCustomElementExpr(astNode: ast.CustomElementExpr): c4.CustomElementExpr {
    invariant(ast.isElementRef(astNode.target), 'ElementRef expected as target of custom element')
    const elementNode = elementRef(astNode.target)
    invariant(elementNode, 'element not found: ' + astNode.$cstNode?.text)
    const element = this.resolveFqn(elementNode)
    const props = astNode.body?.props ?? []
    return props.reduce(
      (acc, prop) => {
        if (ast.isNavigateToProperty(prop)) {
          const viewId = prop.value.view.$refText
          if (isTruthy(viewId)) {
            acc.custom.navigateTo = viewId as c4.ViewID
          }
          return acc
        }
        if (ast.isElementStringProperty(prop)) {
          const value = prop.key === 'description' ? removeIndent(prop.value) : toSingleLine(prop.value)
          acc.custom[prop.key] = value.trim()
          return acc
        }
        if (ast.isColorProperty(prop)) {
          acc.custom[prop.key] = prop.value
          return acc
        }
        if (ast.isShapeProperty(prop)) {
          acc.custom[prop.key] = prop.value
          return acc
        }
        nonexhaustive(prop)
      },
      {
        custom: {
          element
        }
      } as c4.CustomElementExpr
    )
  }

  private parsePredicateExpr(astNode: ast.ViewRulePredicateExpr): c4.Expression {
    if (ast.isRelationExpr(astNode)) {
      return {
        source: this.parseElementExpr(astNode.source),
        target: this.parseElementExpr(astNode.target)
      }
    }
    if (ast.isInOutExpr(astNode)) {
      return {
        inout: this.parseElementExpr(astNode.inout.to)
      }
    }
    if (ast.isOutgoingExpr(astNode)) {
      return {
        outgoing: this.parseElementExpr(astNode.from)
      }
    }
    if (ast.isIncomingExpr(astNode)) {
      return {
        incoming: this.parseElementExpr(astNode.to)
      }
    }
    if (ast.isCustomElementExpr(astNode)) {
      return this.parseCustomElementExpr(astNode)
    }
    if (ast.isElementExpr(astNode)) {
      return this.parseElementExpr(astNode)
    }
    nonexhaustive(astNode)
  }

  private parseViewRule(astRule: ast.ViewRule): c4.ViewRule {
    if (ast.isIncludePredicate(astRule) || ast.isExcludePredicate(astRule)) {
      const exprs = astRule.expressions.flatMap(n => {
        try {
          return this.parsePredicateExpr(n)
        } catch (e) {
          logWarnError(e)
          return []
        }
      })
      return ast.isIncludePredicate(astRule) ? { include: exprs } : { exclude: exprs }
    }
    if (ast.isViewRuleStyle(astRule)) {
      const styleProps = toElementStyle(astRule.styleprops)
      return {
        targets: astRule.targets.map(n => this.parseElementExpr(n)),
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
    const body = astNode.body
    invariant(body, 'ElementView body is not defined')
    const astPath = this.getAstNodePath(astNode)
    let id = astNode.name
    if (!id) {
      const doc = getDocument(astNode).uri.toString()
      id = stringHash(
        doc,
        astPath,
        astNode.viewOf?.$cstNode?.text ?? ''
      ) as c4.ViewID
    }

    const title = body.props.find(p => p.key === 'title')?.value
    const description = body.props.find(p => p.key === 'description')?.value

    const tags = this.convertTags(body)
    const links = body.props.filter(ast.isLinkProperty).map(p => p.value)

    const basic: ParsedAstElementView = {
      id: id as c4.ViewID,
      astPath,
      ...(title && { title }),
      ...(description && { description }),
      ...(tags && { tags }),
      ...(isNonEmptyArray(links) && { links }),
      rules: body.rules.flatMap(n => {
        try {
          return this.parseViewRule(n)
        } catch (e) {
          logWarnError(e)
          return []
        }
      })
    }
    ElementViewOps.writeId(astNode, basic.id)

    if ('viewOf' in astNode) {
      const viewOfEl = elementRef(astNode.viewOf)
      const viewOf = viewOfEl && this.resolveFqn(viewOfEl)
      invariant(viewOf, ' viewOf is not resolved: ' + astNode.$cstNode?.text)
      return {
        ...basic,
        viewOf
      }
    }

    if ('extends' in astNode) {
      const extendsView = astNode.extends.view.ref
      invariant(extendsView?.name, 'view extends is not resolved: ' + astNode.$cstNode?.text)
      return {
        ...basic,
        extends: extendsView.name as c4.ViewID
      }
    }

    return basic
  }

  protected resolveFqn(node: ast.Element | ast.ExtendElement) {
    if (ast.isExtendElement(node)) {
      return getFqnElementRef(node.element)
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
}
