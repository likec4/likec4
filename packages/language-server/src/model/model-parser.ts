import { type c4, InvalidModelError, invariant, isNonEmptyArray, nonexhaustive } from '@likec4/core'
import type { AstNode, LangiumDocument } from 'langium'
import { AstUtils, CstUtils } from 'langium'
import { isTruthy, mapToObj } from 'remeda'
import stripIndent from 'strip-indent'
import type {
  ChecksFromDiagnostics,
  FqnIndexedDocument,
  ParsedAstDynamicView,
  ParsedAstElement,
  ParsedAstElementView,
  ParsedAstRelation,
  ParsedLikeC4LangiumDocument
} from '../ast'
import {
  ast,
  checksFromDiagnostics,
  cleanParsedModel,
  isFqnIndexedDocument,
  parseAstOpacityProperty,
  resolveRelationPoints,
  streamModel,
  toAutoLayout,
  toElementStyle,
  toRelationshipStyleExcludeDefaults,
  ViewOps
} from '../ast'
import { elementRef, getFqnElementRef } from '../elementRef'
import { logError, logger, logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import { stringHash } from '../utils'
import { deserializeFromComment } from '../view-utils/manual-layout'
import type { FqnIndex } from './fqn-index'

const { getDocument } = AstUtils

export type ModelParsedListener = () => void

function toSingleLine<T extends string | undefined>(str: T): T {
  return (isTruthy(str) ? removeIndent(str).split('\n').join(' ') : undefined) as T
}

function removeIndent<T extends string | undefined>(str: T): T {
  return (isTruthy(str) ? stripIndent(str).trim() : undefined) as T
}

export type IsValidFn = ChecksFromDiagnostics['isValid']

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
    const { isValid } = checksFromDiagnostics(doc)
    this.parseSpecification(doc, isValid)
    this.parseModel(doc, isValid)
    this.parseViews(doc, isValid)
    return doc
  }

  private parseSpecification(doc: ParsedLikeC4LangiumDocument, isValid: IsValidFn) {
    const { parseResult, c4Specification } = doc

    const specifications = parseResult.value.specifications.filter(isValid)
    const element_specs = specifications.flatMap(s => s.elements.filter(isValid))
    for (const { kind, style } of element_specs) {
      try {
        const kindName = kind.name as c4.ElementKind
        c4Specification.kinds[kindName] = {
          ...c4Specification.kinds[kindName],
          ...toElementStyle(style?.props)
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

  private parseModel(doc: ParsedLikeC4LangiumDocument, isValid: IsValidFn) {
    for (const el of streamModel(doc, isValid)) {
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
    const style = toElementStyle(stylePropsAst)
    const astPath = this.getAstNodePath(astNode)

    let [title, description, technology] = astNode.props ?? []

    const bodyProps = mapToObj(astNode.body?.props.filter(ast.isElementStringProperty) ?? [], p => [p.key, p.value])

    title = toSingleLine(title ?? bodyProps.title)
    description = removeIndent(description ?? bodyProps.description)
    technology = toSingleLine(technology ?? bodyProps.technology)

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
      style
    }
  }

  private parseRelation(astNode: ast.Relation): ParsedAstRelation {
    const coupling = resolveRelationPoints(astNode)
    const target = this.resolveFqn(coupling.target)
    const source = this.resolveFqn(coupling.source)
    const tags = this.convertTags(astNode) ?? this.convertTags(astNode.body)
    const links = astNode.body?.props.filter(ast.isLinkProperty).map(p => p.value)
    const kind = astNode.kind?.ref?.name as c4.RelationshipKind
    const astPath = this.getAstNodePath(astNode)
    const title = removeIndent(
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
      ...(isNonEmptyArray(links) && { links }),
      ...toRelationshipStyleExcludeDefaults(styleProp?.props)
    }
  }

  private parseViews(doc: ParsedLikeC4LangiumDocument, isValid: IsValidFn) {
    const views = doc.parseResult.value.views.flatMap(v => isValid(v) ? v.views : [])
    for (const view of views) {
      try {
        if (!isValid(view)) {
          continue
        }
        doc.c4Views.push(
          ast.isElementView(view) ? this.parseElementView(view, isValid) : this.parseDynamicElementView(view, isValid)
        )
      } catch (e) {
        logWarnError(e)
      }
    }
  }

  // TODO validate view rules
  private parseViewRulePredicate(astNode: ast.ViewRulePredicate, _isValid: IsValidFn): c4.ViewRulePredicate {
    const exprs = [] as c4.Expression[]
    let exprNode: ast.Expressions | undefined = astNode.exprs
    while (exprNode) {
      try {
        exprs.unshift(this.parseExpression(exprNode.value))
      } catch (e) {
        logWarnError(e)
      }
      exprNode = exprNode.prev
    }
    return ast.isIncludePredicate(astNode) ? { include: exprs } : { exclude: exprs }
  }

  private parseElementExpressionsIterator(astNode: ast.ElementExpressionsIterator): c4.ElementExpression[] {
    const exprs = [] as c4.ElementExpression[]
    let iter: ast.ElementExpressionsIterator | undefined = astNode
    while (iter) {
      try {
        exprs.unshift(this.parseElementExpr(iter.value))
      } catch (e) {
        logWarnError(e)
      }
      iter = iter.prev
    }
    return exprs
  }

  private parseElementExpr(astNode: ast.ElementExpression): c4.ElementExpression {
    if (ast.isWildcardExpression(astNode)) {
      return {
        wildcard: true
      }
    }
    if (ast.isElementKindExpression(astNode)) {
      invariant(astNode.kind, 'ElementKindExpr kind is not resolved: ' + astNode.$cstNode?.text)
      return {
        elementKind: astNode.kind.$refText as c4.ElementKind,
        isEqual: astNode.isEqual
      }
    }
    if (ast.isElementTagExpression(astNode)) {
      invariant(astNode.tag, 'ElementTagExpr tag is not resolved: ' + astNode.$cstNode?.text)
      let elementTag = astNode.tag.$refText
      if (elementTag.startsWith('#')) {
        elementTag = elementTag.slice(1)
      }
      return {
        elementTag: elementTag as c4.Tag,
        isEqual: astNode.isEqual
      }
    }
    if (ast.isExpandElementExpression(astNode)) {
      const elementNode = elementRef(astNode.expand)
      invariant(elementNode, 'Element not found ' + astNode.expand.$cstNode?.text)
      const expanded = this.resolveFqn(elementNode)
      return {
        expanded
      }
    }
    if (ast.isElementDescedantsExpression(astNode)) {
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

  private parseCustomElementExpr(astNode: ast.CustomElementExpression): c4.CustomElementExpr {
    let targetRef
    switch (true) {
      case ast.isElementRef(astNode.target):
        targetRef = astNode.target
        break
      case ast.isExpandElementExpression(astNode.target):
        targetRef = astNode.target.expand
        break
      case ast.isElementDescedantsExpression(astNode.target):
        targetRef = astNode.target.parent
        break
      default:
        throw new Error('Unsupported target of custom element')
    }
    const elementNode = elementRef(targetRef)
    invariant(elementNode, 'element not found: ' + astNode.$cstNode?.text)
    const element = this.resolveFqn(elementNode)
    const props = astNode.custom.props ?? []
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
        if (ast.isIconProperty(prop)) {
          acc.custom[prop.key] = prop.value as c4.IconUrl
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
        if (ast.isBorderProperty(prop)) {
          acc.custom[prop.key] = prop.value
          return acc
        }
        if (ast.isOpacityProperty(prop)) {
          acc.custom[prop.key] = parseAstOpacityProperty(prop)
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

  private parseExpression(astNode: ast.Expression): c4.Expression {
    if (ast.isCustomRelationExpression(astNode)) {
      return this.parseCustomRelationExpr(astNode)
    }
    if (ast.isCustomElementExpression(astNode)) {
      return this.parseCustomElementExpr(astNode)
    }
    if (ast.isElementExpression(astNode)) {
      return this.parseElementExpr(astNode)
    }
    if (ast.isRelationExpression(astNode)) {
      return this.parseRelationExpr(astNode)
    }
    nonexhaustive(astNode)
  }

  private parseCustomRelationExpr(astNode: ast.CustomRelationExpression): c4.CustomRelationExpr {
    const relation = this.parseRelationExpr(astNode.relation)
    const props = astNode.custom.props ?? []
    return props.reduce(
      (acc, prop) => {
        if (ast.isRelationStringProperty(prop)) {
          const value = removeIndent(prop.value)
          if (isTruthy(value)) {
            acc.customRelation['title'] = value
          }
          return acc
        }
        if (ast.isArrowProperty(prop)) {
          acc.customRelation[prop.key] = prop.value
          return acc
        }
        if (ast.isColorProperty(prop)) {
          acc.customRelation[prop.key] = prop.value
          return acc
        }
        if (ast.isLineProperty(prop)) {
          acc.customRelation[prop.key] = prop.value
          return acc
        }
        nonexhaustive(prop)
      },
      {
        customRelation: {
          relation
        }
      } as c4.CustomRelationExpr
    )
  }

  private parseRelationExpr(astNode: ast.RelationExpression): c4.RelationExpression {
    if (ast.isDirectedRelationExpression(astNode)) {
      return {
        source: this.parseElementExpr(astNode.source.from),
        target: this.parseElementExpr(astNode.target),
        isBidirectional: astNode.source.isBidirectional
      }
    }
    if (ast.isInOutRelationExpression(astNode)) {
      return {
        inout: this.parseElementExpr(astNode.inout.to)
      }
    }
    if (ast.isOutgoingRelationExpression(astNode)) {
      return {
        outgoing: this.parseElementExpr(astNode.from)
      }
    }
    if (ast.isIncomingRelationExpression(astNode)) {
      return {
        incoming: this.parseElementExpr(astNode.to)
      }
    }
    nonexhaustive(astNode)
  }

  private parseViewRule(astRule: ast.ViewRule, isValid: IsValidFn): c4.ViewRule {
    if (ast.isViewRulePredicate(astRule)) {
      return this.parseViewRulePredicate(astRule, isValid)
    }
    if (ast.isViewRuleStyle(astRule)) {
      const styleProps = toElementStyle(astRule.styleprops)
      return {
        targets: this.parseElementExpressionsIterator(astRule.target),
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

  private parseViewManualLaout(node: ast.DynamicView | ast.ElementView): c4.ViewManualLayout | undefined {
    const commentNode = CstUtils.findCommentNode(node.$cstNode, ['BLOCK_COMMENT'])
    if (!commentNode) {
      return undefined
    }
    return deserializeFromComment(commentNode.text)
  }

  private parseDynamicStep(node: ast.DynamicViewStep): c4.DynamicViewStep {
    const sourceEl = elementRef(node.source)
    if (!sourceEl) {
      throw new Error('Invalid reference to source')
    }
    const targetEl = elementRef(node.target)
    if (!targetEl) {
      throw new Error('Invalid reference to target')
    }
    const title = removeIndent(node.title) ?? null
    let source = this.resolveFqn(sourceEl)
    let target = this.resolveFqn(targetEl)
    if (node.isBackward) {
      return {
        source: target,
        target: source,
        title,
        isBackward: true
      }
    }

    return {
      source,
      target,
      title
    }
  }

  private parseElementView(astNode: ast.ElementView, isValid: IsValidFn): ParsedAstElementView {
    const body = astNode.body
    invariant(body, 'ElementView body is not defined')
    const astPath = this.getAstNodePath(astNode)

    let viewOf = null as c4.Fqn | null
    if ('viewOf' in astNode) {
      const viewOfEl = elementRef(astNode.viewOf)
      const _viewOf = viewOfEl && this.resolveFqn(viewOfEl)
      if (!_viewOf) {
        logger.warn('viewOf is not resolved: ' + astNode.$cstNode?.text)
      } else {
        viewOf = _viewOf
      }
    }

    let id = astNode.name
    if (!id) {
      id = 'view_' + stringHash(
        getDocument(astNode).uri.toString(),
        astPath,
        viewOf ?? ''
      ) as c4.ViewID
    }

    const title = toSingleLine(body.props.find(p => p.key === 'title')?.value) ?? null
    const description = removeIndent(body.props.find(p => p.key === 'description')?.value) ?? null

    const tags = this.convertTags(body)
    const links = body.props.filter(ast.isLinkProperty).map(p => p.value)

    const manualLayout = this.parseViewManualLaout(astNode)

    const view: ParsedAstElementView = {
      __: 'element',
      id: id as c4.ViewID,
      astPath,
      title,
      description,
      tags,
      links: isNonEmptyArray(links) ? links : null,
      rules: body.rules.flatMap(n => {
        try {
          return isValid(n) ? this.parseViewRule(n, isValid) : []
        } catch (e) {
          logWarnError(e)
          return []
        }
      }),
      ...(viewOf && { viewOf }),
      ...(manualLayout && { manualLayout })
    }
    ViewOps.writeId(astNode, view.id)

    if ('extends' in astNode) {
      const extendsView = astNode.extends.view.ref
      invariant(extendsView?.name, 'view extends is not resolved: ' + astNode.$cstNode?.text)
      return Object.assign(view, {
        extends: extendsView.name as c4.ViewID
      })
    }

    return view
  }

  private parseDynamicElementView(astNode: ast.DynamicView, isValid: IsValidFn): ParsedAstDynamicView {
    const body = astNode.body
    invariant(body, 'ElementView body is not defined')
    // only valid props
    const props = body.props.filter(isValid)
    const astPath = this.getAstNodePath(astNode)

    let id = astNode.name
    if (!id) {
      id = 'dynamic_' + stringHash(
        getDocument(astNode).uri.toString(),
        astPath
      ) as c4.ViewID
    }

    const title = toSingleLine(props.find(p => p.key === 'title')?.value) ?? null
    const description = removeIndent(props.find(p => p.key === 'description')?.value) ?? null

    const tags = this.convertTags(body)
    const links = props.filter(ast.isLinkProperty).map(p => p.value)

    ViewOps.writeId(astNode, id as c4.ViewID)

    const manualLayout = this.parseViewManualLaout(astNode)

    return {
      __: 'dynamic',
      id: id as c4.ViewID,
      astPath,
      title,
      description,
      tags,
      links: isNonEmptyArray(links) ? links : null,
      rules: body.rules.reduce((acc, n) => {
        if (!isValid(n)) {
          return acc
        }
        try {
          if (ast.isDynamicViewRulePredicate(n)) {
            const include = [] as (c4.ElementExpression | c4.CustomElementExpr)[]
            let iter: ast.DynamicViewRulePredicateIterator | undefined = n.exprs
            while (iter) {
              try {
                switch (true) {
                  case ast.isElementExpression(iter.value):
                    isValid(iter.value) && include.unshift(this.parseElementExpr(iter.value))
                    break

                  case ast.isCustomElementExpression(iter.value):
                    isValid(iter.value) && include.unshift(this.parseCustomElementExpr(iter.value))
                    break
                  default:
                    nonexhaustive(iter.value)
                }
              } catch (e) {
                logWarnError(e)
              }
              iter = iter.prev
            }
            if (include.length > 0) {
              acc.push({ include })
            }
            return acc
          }
          if (ast.isViewRuleStyle(n)) {
            const styleProps = toElementStyle(n.styleprops)
            const targets = this.parseElementExpressionsIterator(n.target)
            if (targets.length > 0) {
              acc.push({
                targets,
                style: {
                  ...styleProps
                }
              })
            }
            return acc
          }
          if (ast.isViewRuleAutoLayout(n)) {
            acc.push({
              autoLayout: toAutoLayout(n.direction)
            })
            return acc
          }
          nonexhaustive(n)
        } catch (e) {
          logWarnError(e)
          return acc
        }
      }, [] as Array<c4.DynamicViewRule>),
      steps: body.steps.reduce((acc, n) => {
        try {
          if (isValid(n)) {
            acc.push(this.parseDynamicStep(n))
          }
        } catch (e) {
          logWarnError(e)
        }
        return acc
      }, [] as c4.DynamicViewStep[]),
      ...(manualLayout && { manualLayout })
    }
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
    return isNonEmptyArray(tags) ? tags : null
  }
}
