import { type HexColorLiteral, invariant, isNonEmptyArray, nonexhaustive } from '@likec4/core'
import type * as c4 from '@likec4/core'
import type { AstNode, LangiumDocument } from 'langium'
import { AstUtils, CstUtils } from 'langium'
import { filter, first, flatMap, isDefined, isNonNullish, isTruthy, map, mapToObj, pipe } from 'remeda'
import stripIndent from 'strip-indent'
import type { Writable } from 'type-fest'
import type {
  ChecksFromDiagnostics,
  FqnIndexedDocument,
  ParsedAstDynamicView,
  ParsedAstElement,
  ParsedAstElementView,
  ParsedAstRelation,
  ParsedLikeC4LangiumDocument,
  ParsedLink
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
  toColor,
  toElementStyle,
  toRelationshipStyleExcludeDefaults,
  ViewOps
} from '../ast'
import { elementRef, getFqnElementRef } from '../elementRef'
import { logError, logger, logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import { stringHash } from '../utils'
import { deserializeFromComment, hasManualLayout } from '../view-utils/manual-layout'
import type { FqnIndex } from './fqn-index'
import { parseWhereClause } from './model-parser-where'
import {
  isDynamicViewIncludePredicate,
  isGlobalDynamicPredicateGroup,
  isGlobalPredicateGroup,
  isGlobalStyle,
  isGlobalStyleGroup,
  type NotationProperty
} from '../generated/ast'

const { getDocument } = AstUtils

export type ModelParsedListener = () => void

function toSingleLine<T extends string | undefined | null>(str: T): T {
  return (isNonNullish(str) ? removeIndent(str).split('\n').join(' ') : undefined) as T
}

function removeIndent<T extends string | undefined | null>(str: T): T {
  return (isNonNullish(str) ? stripIndent(str).trim() : undefined) as T
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
        logError(new Error(`Error parsing document ${doc.uri.toString()}`, { cause }))
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
    for (const { kind, props } of element_specs) {
      try {
        const kindName = kind.name as c4.ElementKind
        if (!isTruthy(kindName)) {
          continue
        }
        if (kindName in c4Specification.elements) {
          logger.warn(`Element kind "${kindName}" is already defined`)
          continue
        }
        const style = props.find(ast.isElementStyleProperty)
        const bodyProps = mapToObj(
          props.filter(ast.isSpecificationElementStringProperty).filter(p => isNonNullish(p.value)) ?? [],
          p => [p.key, removeIndent(p.value)] as const
        )
        c4Specification.elements[kindName] = {
          ...bodyProps,
          style: {
            ...toElementStyle(style?.props, isValid)
          }
        }
      } catch (e) {
        logWarnError(e)
      }
    }

    const relations_specs = specifications.flatMap(s => s.relationships.filter(isValid))
    for (const { kind, props } of relations_specs) {
      try {
        const kindName = kind.name as c4.RelationshipKind
        if (!isTruthy(kindName)) {
          continue
        }
        if (kindName in c4Specification.relationships) {
          logger.warn(`Relationship kind "${kindName}" is already defined`)
          continue
        }
        const bodyProps = mapToObj(
          props.filter(ast.isSpecificationRelationshipStringProperty).filter(p => isNonNullish(p.value)) ?? [],
          p => [p.key, removeIndent(p.value)]
        )
        c4Specification.relationships[kindName] = {
          ...bodyProps,
          ...toRelationshipStyleExcludeDefaults(props)
        }
      } catch (e) {
        logWarnError(e)
      }
    }

    const tags_specs = specifications.flatMap(s => s.tags.filter(isValid))
    for (const tagSpec of tags_specs) {
      const tag = tagSpec.tag.name as c4.Tag
      if (isTruthy(tag)) {
        c4Specification.tags.add(tag)
      }
    }

    const colors_specs = specifications.flatMap(s => s.colors.filter(isValid))
    for (const { name, color } of colors_specs) {
      try {
        const colorName = name.name as c4.CustomColor
        if (colorName in c4Specification.colors) {
          logger.warn(`Custom color "${colorName}" is already defined`)
          continue
        }

        c4Specification.colors[colorName] = {
          color: color as HexColorLiteral
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
          doc.c4Elements.push(this.parseElement(el, isValid))
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

  private parseElement(astNode: ast.Element, isValid: IsValidFn): ParsedAstElement {
    const id = this.resolveFqn(astNode)
    const kind = astNode.kind.$refText as c4.ElementKind
    const tags = this.convertTags(astNode.body)
    const stylePropsAst = astNode.body?.props.find(ast.isElementStyleProperty)?.props
    const style = toElementStyle(stylePropsAst, isValid)
    const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))
    const astPath = this.getAstNodePath(astNode)

    let [title, description, technology] = astNode.props ?? []

    const bodyProps = mapToObj(
      astNode.body?.props.filter(ast.isElementStringProperty) ?? [],
      p => [p.key, p.value || undefined]
    )

    title = toSingleLine(title ?? bodyProps.title)
    description = removeIndent(bodyProps.description ?? description)
    technology = toSingleLine(bodyProps.technology ?? technology)

    const links = this.convertLinks(astNode.body)

    // Property has higher priority than from style
    const iconProp = astNode.body?.props.find(ast.isIconProperty)
    if (iconProp) {
      const value = iconProp.libicon?.ref?.name ?? iconProp.value
      if (isTruthy(value)) {
        style.icon = value as c4.IconUrl
      }
    }

    return {
      id,
      kind,
      astPath,
      title: title ?? astNode.name,
      ...(metadata && { metadata }),
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
    const links = this.convertLinks(astNode.body)
    const kind = astNode.kind?.ref?.name as (c4.RelationshipKind | undefined)
    const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))
    const astPath = this.getAstNodePath(astNode)

    const bodyProps = mapToObj(
      astNode.body?.props.filter(ast.isRelationStringProperty).filter(p => isNonNullish(p.value)) ?? [],
      p => [p.key, p.value]
    )

    const navigateTo = pipe(
      astNode.body?.props ?? [],
      filter(ast.isRelationNavigateToProperty),
      map(p => p.value.view.ref?.name),
      filter(isTruthy),
      first()
    )

    const title = removeIndent(astNode.title ?? bodyProps.title) ?? ''
    const description = removeIndent(bodyProps.description)
    const technology = removeIndent(astNode.technology) ?? toSingleLine(bodyProps.technology)

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
      ...(metadata && { metadata }),
      ...(isTruthy(technology) && { technology }),
      ...(isTruthy(description) && { description }),
      ...(kind && { kind }),
      ...(tags && { tags }),
      ...(isNonEmptyArray(links) && { links }),
      ...toRelationshipStyleExcludeDefaults(styleProp?.props),
      ...(navigateTo && { navigateTo: navigateTo as c4.ViewID })
    }
  }

  private parseViews(doc: ParsedLikeC4LangiumDocument, isValid: IsValidFn) {
    const viewGroups = doc.parseResult.value.views.filter(v => isValid(v))
    for (const viewGroup of viewGroups) {
      const localStyles = viewGroup.styles
        .flatMap(s => this.parseViewRuleStyle(s, isValid))
      const globalStyles = viewGroup.global_styles
        .flatMap(sg => this.parseViewRuleGlobalStyle(sg, isValid))
      const stylesToApply = [...localStyles, ...globalStyles]

      for (const view of viewGroup.views) {
        try {
          if (!isValid(view)) {
            continue
          }
          doc.c4Views.push(
            ast.isElementView(view) ? this.parseElementView(view, stylesToApply, isValid) : this.parseDynamicElementView(view, stylesToApply, isValid)
          )
        } catch (e) {
          logWarnError(e)
        }
      }
    }
  }

  // TODO validate view rules
  private parseViewRulePredicate(astNode: ast.ViewRulePredicate, _isValid: IsValidFn): c4.ViewRulePredicate {
    const exprs = [] as c4.Expression[]
    let predicate: ast.Predicates | undefined = astNode.predicates
    while (predicate) {
      try {
        if (isTruthy(predicate.value) && _isValid(predicate.value as any)) {
          exprs.unshift(this.parsePredicate(predicate.value, _isValid))
        }
      } catch (e) {
        logWarnError(e)
      }
      predicate = predicate.prev
    }
    return ast.isIncludePredicate(astNode) ? { include: exprs } : { exclude: exprs }
  }

  private parsePredicate(astNode: ast.Predicate, _isValid: IsValidFn): c4.Expression {
    if (ast.isElementPredicate(astNode)) {
      return this.parseElementPredicate(astNode, _isValid)
    }
    if (ast.isRelationPredicate(astNode)) {
      return this.parseRelationPredicate(astNode, _isValid)
    }
    nonexhaustive(astNode)
  }

  private parseElementExpressionsIterator(astNode: ast.ElementExpressionsIterator): c4.ElementExpression[] {
    const exprs = [] as c4.ElementExpression[]
    let iter: ast.ElementExpressionsIterator['prev'] = astNode
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

  private parseElementPredicate(astNode: ast.ElementPredicate, _isValid: IsValidFn): c4.ElementPredicateExpression {
    if (ast.isElementPredicateWith(astNode)) {
      return this.parseElementPredicateWith(astNode, _isValid)
    }
    if (ast.isElementPredicateWhere(astNode)) {
      return this.parseElementPredicateWhere(astNode)
    }
    if (ast.isElementExpression(astNode)) {
      return this.parseElementExpr(astNode)
    }
    nonexhaustive(astNode)
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

  private parseElementPredicateWith(
    astNode: ast.ElementPredicateWith,
    _isValid: IsValidFn
  ): c4.CustomElementExpr {
    const expr = this.parseElementPredicate(astNode.subject, _isValid)
    const props = astNode.custom?.props ?? []
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
          if (isDefined(prop.value)) {
            let value = prop.key === 'description' ? removeIndent(prop.value) : toSingleLine(prop.value)
            acc.custom[prop.key] = value || ''
          }
          return acc
        }
        if (ast.isIconProperty(prop)) {
          const value = prop.libicon?.ref?.name ?? prop.value
          if (isDefined(value)) {
            acc.custom[prop.key] = value as c4.IconUrl
          }
          return acc
        }
        if (ast.isColorProperty(prop)) {
          const value = toColor(prop)
          if (isDefined(value)) {
            acc.custom[prop.key] = value
          }
          return acc
        }
        if (ast.isShapeProperty(prop)) {
          if (isDefined(prop.value)) {
            acc.custom[prop.key] = prop.value
          }
          return acc
        }
        if (ast.isBorderProperty(prop)) {
          if (isDefined(prop.value)) {
            acc.custom[prop.key] = prop.value
          }
          return acc
        }
        if (ast.isOpacityProperty(prop)) {
          if (isDefined(prop.value)) {
            acc.custom[prop.key] = parseAstOpacityProperty(prop)
          }
          return acc
        }
        if (ast.isNotationProperty(prop)) {
          if (isTruthy(prop.value)) {
            acc.custom[prop.key] = removeIndent(prop.value)
          }
          return acc
        }
        nonexhaustive(prop)
      },
      {
        custom: {
          expr
        }
      } as c4.CustomElementExpr
    )
  }
  private parseElementPredicateWhere(
    astNode: ast.ElementPredicateWhere
  ): c4.ElementWhereExpr {
    const expr = this.parseElementExpr(astNode.subject)
    return {
      where: {
        expr,
        condition: astNode.where ? parseWhereClause(astNode.where) : {
          kind: { neq: '--always-true--' }
        }
      }
    }
  }

  private parseRelationPredicate(astNode: ast.RelationPredicate, _isValid: IsValidFn): c4.RelationPredicateExpression {
    if (ast.isRelationPredicateWith(astNode)) {
      const subject = ast.isRelationPredicateWhere(astNode.subject) ? astNode.subject.subject : astNode.subject
      return this.parseRelationPredicateWith(astNode, subject)
    }
    if (ast.isRelationPredicateWhere(astNode)) {
      return this.parseRelationPredicateWhere(astNode)
    }
    if (ast.isRelationExpression(astNode)) {
      return this.parseRelationExpr(astNode)
    }
    nonexhaustive(astNode)
  }

  private parseRelationPredicateWhere(
    astNode: ast.RelationPredicateWhere
  ): c4.RelationWhereExpr {
    const expr = this.parseRelationExpr(astNode.subject)
    return {
      where: {
        expr,
        condition: astNode.where ? parseWhereClause(astNode.where) : {
          kind: { neq: '--always-true--' }
        }
      }
    }
  }

  private parseRelationPredicateWith(
    astNode: ast.RelationPredicateWith,
    subject: ast.RelationExpression
  ): c4.CustomRelationExpr {
    const relation = this.parseRelationExpr(subject)
    const props = astNode.custom?.props ?? []
    return props.reduce(
      (acc, prop) => {
        if (ast.isRelationStringProperty(prop) || ast.isNotationProperty(prop) || ast.isNotesProperty(prop)) {
          if (isDefined(prop.value)) {
            acc.customRelation[prop.key] = removeIndent(prop.value) ?? ''
          }
          return acc
        }
        if (ast.isArrowProperty(prop)) {
          if (isTruthy(prop.value)) {
            acc.customRelation[prop.key] = prop.value
          }
          return acc
        }
        if (ast.isColorProperty(prop)) {
          const value = toColor(prop)
          if (isTruthy(value)) {
            acc.customRelation[prop.key] = value
          }
          return acc
        }
        if (ast.isLineProperty(prop)) {
          if (isTruthy(prop.value)) {
            acc.customRelation[prop.key] = prop.value
          }
          return acc
        }
        if (ast.isRelationNavigateToProperty(prop)) {
          const viewId = prop.value.view.ref?.name
          if (isTruthy(viewId)) {
            acc.customRelation.navigateTo = viewId as c4.ViewID
          }
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

  private parseViewRule(astRule: ast.ViewRule, isValid: IsValidFn): c4.ViewRule[] {
    if (ast.isViewRulePredicate(astRule)) {
      return [this.parseViewRulePredicate(astRule, isValid)]
    }
    if (ast.isViewRuleStyle(astRule)) {
      return [this.parseViewRuleStyle(astRule, isValid)]
    }
    if (ast.isViewRuleAutoLayout(astRule)) {
      return [{
        autoLayout: toAutoLayout(astRule.direction)
      }]
    }
    if (ast.isViewRuleGlobalStyle(astRule)) {
      return this.parseViewRuleGlobalStyle(astRule, isValid)
    }
    if (ast.isViewRuleGlobalPredicate(astRule)) {
      return this.parseViewRuleGlobalPredicate(astRule, isValid)
    }
    nonexhaustive(astRule)
  }

  private parseViewRuleStyle(astRule: ast.ViewRuleStyle, isValid: IsValidFn): c4.ViewRuleStyle {
    const styleProps = astRule.props.filter(ast.isStyleProperty)
    const targets = astRule.target
    const notation = astRule.props.find(ast.isNotationProperty)
    return this.parseRuleStyle(styleProps, targets, isValid, notation)
  }

  private parseRuleStyle(styleProperties: ast.StyleProperty[], elementExpressionsIterator: ast.ElementExpressionsIterator, isValid: IsValidFn, notationProperty?: NotationProperty): c4.ViewRuleStyle {
    const styleProps = toElementStyle(styleProperties, isValid)
    const notation = removeIndent(notationProperty?.value)
    const targets = this.parseElementExpressionsIterator(elementExpressionsIterator)
    return {
      targets,
      ...(notation && { notation }),
      style: {
        ...styleProps
      }
    }
  }

  private parseViewRuleGlobalStyle(astRule: ast.ViewRuleGlobalStyle, isValid: IsValidFn): c4.ViewRuleStyle[] {
    const globalRule = astRule.style.ref
    if (globalRule === undefined) {
      return []
    }
    const globalStyleNode = globalRule.$container
    if (isGlobalStyle(globalStyleNode)) {
      const styleToApply = this.parseGlobalStyle(globalStyleNode, isValid)
      return [styleToApply]
    }
    if (isGlobalStyleGroup(globalStyleNode)) {
      const stylesToApply = globalStyleNode.styles
        .map(s => this.parseViewRuleStyle(s, isValid))
      return stylesToApply
    }
    nonexhaustive(globalStyleNode)
  }

  private parseViewRuleGlobalPredicate(astRule: ast.ViewRuleGlobalPredicate, isValid: IsValidFn): c4.ViewRulePredicate[] {
    const globalRule = astRule.predicate.ref
    if (globalRule === undefined) {
      return []
    }
    if (isGlobalPredicateGroup(globalRule)) {
      const predicatesToApply = globalRule.predicates
        .map(p => this.parseViewRulePredicate(p, isValid))
      return predicatesToApply
    }
    nonexhaustive(globalRule)
  }

  private parseGlobalStyle(node: ast.GlobalStyle, isValid: IsValidFn): c4.ViewRuleStyle {
    const styleProps = node.props.filter(ast.isStyleProperty)
    const targets = node.target
    const notation = node.props.find(ast.isNotationProperty)
    let style = this.parseRuleStyle(styleProps, targets, isValid, notation)
    return style
  }

  private parseViewManualLaout(node: ast.DynamicView | ast.ElementView): c4.ViewManualLayout | undefined {
    const commentNode = CstUtils.findCommentNode(node.$cstNode, ['BLOCK_COMMENT'])
    if (!commentNode || !hasManualLayout(commentNode.text)) {
      return undefined
    }
    try {
      return deserializeFromComment(commentNode.text)
    } catch (e) {
      const doc = getDocument(node)
      logger.warn(e)
      logger.warn(
        `Ignoring manual layout of "${node.name ?? 'unnamed'}" at ${doc.uri.fsPath}:${
          1 + (commentNode.range.start.line || 0)
        }`
      )
      return undefined
    }
  }

  private parseDynamicParallelSteps(node: ast.DynamicViewParallelSteps): c4.DynamicViewParallelSteps {
    return {
      __parallel: node.steps.map(step => this.parseDynamicStep(step))
    }
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
    let source = this.resolveFqn(sourceEl)
    let target = this.resolveFqn(targetEl)
    const title = removeIndent(node.title) ?? null

    let step: Writable<c4.DynamicViewStep> = {
      source,
      target,
      title
    }
    if (node.isBackward) {
      step = {
        source: target,
        target: source,
        title,
        isBackward: true
      }
    }
    if (Array.isArray(node.custom?.props)) {
      for (const prop of node.custom.props) {
        try {
          if (ast.isRelationStringProperty(prop) || ast.isNotationProperty(prop) || ast.isNotesProperty(prop)) {
            if (isDefined(prop.value)) {
              step[prop.key] = removeIndent(prop.value) ?? ''
            }
            continue
          }
          if (ast.isArrowProperty(prop)) {
            if (isDefined(prop.value)) {
              step[prop.key] = prop.value
            }
            continue
          }
          if (ast.isColorProperty(prop)) {
            const value = toColor(prop)
            if (isDefined(value)) {
              step[prop.key] = value
            }
            continue
          }
          if (ast.isLineProperty(prop)) {
            if (isDefined(prop.value)) {
              step[prop.key] = prop.value
            }
            continue
          }
          if (ast.isRelationNavigateToProperty(prop)) {
            const viewId = prop.value.view.ref?.name
            if (isTruthy(viewId)) {
              step.navigateTo = viewId as c4.ViewID
            }
            continue
          }
          nonexhaustive(prop)
        }
        catch (e) {
          logWarnError(e)
        }
      }
    }
    return step
  }

  private parseElementView(astNode: ast.ElementView, additionalStyles: c4.ViewRuleStyle[], isValid: IsValidFn): ParsedAstElementView {
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
    const links = this.convertLinks(body)

    const manualLayout = this.parseViewManualLaout(astNode)

    const view: ParsedAstElementView = {
      __: 'element',
      id: id as c4.ViewID,
      astPath,
      title,
      description,
      tags,
      links: isNonEmptyArray(links) ? links : null,
      rules: [...additionalStyles, ...body.rules.flatMap(n => {
        try {
          return isValid(n) ? this.parseViewRule(n, isValid) : []
        } catch (e) {
          logWarnError(e)
          return []
        }
      })],
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

  private parseDynamicElementView(astNode: ast.DynamicView, additionalStyles: c4.ViewRuleStyle[], isValid: IsValidFn): ParsedAstDynamicView {
    const body = astNode.body
    invariant(body, 'DynamicElementView body is not defined')
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
    const links = this.convertLinks(body)

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
      rules: [...additionalStyles, ...body.rules.flatMap(n => {
        try {
          return isValid(n) ? this.parseDynamicViewRule(n, isValid) : []
        } catch (e) {
          logWarnError(e)
          return []
        }
      }, [] as Array<c4.DynamicViewRule>)],
      steps: body.steps.reduce((acc, n) => {
        try {
          if (isValid(n)) {
            if (ast.isDynamicViewParallelSteps(n)) {
              acc.push(this.parseDynamicParallelSteps(n))
            } else {
              acc.push(this.parseDynamicStep(n))
            }
          }
        } catch (e) {
          logWarnError(e)
        }
        return acc
      }, [] as c4.DynamicViewStepOrParallel[]),
      ...(manualLayout && { manualLayout })
    }
  }

  private parseDynamicViewRule(astRule: ast.DynamicViewRule, isValid: IsValidFn): c4.DynamicViewRule[] {
    if (ast.isDynamicViewIncludePredicate(astRule)) {
      return this.parseDynamicViewIncludePredicate(astRule, isValid)
    }
    if (ast.isViewRuleStyle(astRule)) {
      return [this.parseViewRuleStyle(astRule, isValid)]
    }
    if (ast.isViewRuleAutoLayout(astRule)) {
      return [{
        autoLayout: toAutoLayout(astRule.direction)
      }]
    }
    if (ast.isViewRuleGlobalStyle(astRule)) {
      return this.parseViewRuleGlobalStyle(astRule, isValid)
    }
    if (ast.isDynamicViewRuleGlobalPredicate(astRule)) {
      return this.parseDynamicViewRuleGlobalPredicate(astRule, isValid)
    }
    nonexhaustive(astRule)
  }

  private parseDynamicViewIncludePredicate(astRule: ast.DynamicViewIncludePredicate, isValid: IsValidFn): c4.DynamicViewIncludeRule[] {
      const include = [] as c4.ElementPredicateExpression[]
      let iter: ast.DynamicViewPredicateIterator | undefined = astRule.predicates
      while (iter) {
        try {
          if (isValid(iter.value as any)) {
            const c4expr = this.parseElementPredicate(iter.value, isValid)
            include.unshift(c4expr)
          }
        } catch (e) {
          logWarnError(e)
        }
        iter = iter.prev
      }
      return [{ include }]
  }

  private parseDynamicViewRuleGlobalPredicate(astRule: ast.DynamicViewRuleGlobalPredicate, isValid: IsValidFn): c4.DynamicViewIncludeRule[] {
    const globalRule = astRule.predicate.ref
    if (globalRule === undefined) {
      return []
    }
    if (isGlobalDynamicPredicateGroup(globalRule)) {
      const predicatesToApply = globalRule.predicates
        .filter(p => isDynamicViewIncludePredicate(p))
        .flatMap(p => this.parseDynamicViewIncludePredicate(p, isValid))
      return predicatesToApply
    }
    nonexhaustive(globalRule)
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

  private getMetadata(metadataAstNode: ast.MetadataProperty | undefined): { [key: string]: string } | undefined {
    return metadataAstNode?.props != null
      ? mapToObj(metadataAstNode.props, (p) => [p.key, removeIndent(p.value)])
      : undefined
  }

  private convertTags<E extends { tags?: ast.Tags }>(withTags?: E) {
    let iter = withTags?.tags
    if (!iter) {
      return null
    }
    const tags = [] as c4.Tag[]
    while (iter) {
      try {
        const values = iter.values.map(t => t.ref?.name).filter(isTruthy) as c4.Tag[]
        if (values.length > 0) {
          tags.unshift(...values)
        }
      } catch (e) {
        // ignore
      }
      iter = iter.prev
    }
    return isNonEmptyArray(tags) ? tags : null
  }

  private convertLinks(source?: ast.LinkProperty['$container']): ParsedLink[] | undefined {
    if (!source?.props || source.props.length === 0) {
      return undefined
    }
    return pipe(
      source.props,
      filter(ast.isLinkProperty),
      flatMap(p => {
        const url = p.value
        if (isTruthy(url)) {
          const title = isTruthy(p.title) ? toSingleLine(p.title) : undefined
          return title ? { url, title } : { url }
        }
        return []
      })
    )
  }
}
