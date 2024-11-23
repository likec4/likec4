import type * as c4 from '@likec4/core'
import { type HexColorLiteral, invariant, isNonEmptyArray, nameFromFqn, nonexhaustive, nonNullable } from '@likec4/core'
import type { AstNode, LangiumDocument } from 'langium'
import { AstUtils, CstUtils } from 'langium'
import { filter, first, flatMap, isArray, isDefined, isNonNullish, isTruthy, map, mapToObj, pipe } from 'remeda'
import stripIndent from 'strip-indent'
import type { Writable } from 'type-fest'
import type {
  ChecksFromDiagnostics,
  FqnIndexedDocument,
  ParsedAstDeployment,
  ParsedAstDeploymentView,
  ParsedAstDynamicView,
  ParsedAstElement,
  ParsedAstElementView,
  ParsedAstGlobals,
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
import { type NotationProperty } from '../generated/ast'
import { logError, logger, logWarnError } from '../logger'
import type { LikeC4Services } from '../module'
import { stringHash } from '../utils'
import { instanceRef } from '../utils/deploymentRef'
import { elementRef, getFqnElementRef } from '../utils/elementRef'
import { deserializeFromComment, hasManualLayout } from '../view-utils/manual-layout'
import type { FqnIndex } from './fqn-index'
import { parseWhereClause } from './model-parser-where'

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
    this.parseGlobal(doc, isValid)
    this.parseDeployment(doc, isValid)
    this.parseViews(doc, isValid)
    return doc
  }

  private parseSpecification(doc: ParsedLikeC4LangiumDocument, isValid: IsValidFn) {
    const {
      parseResult: {
        value: {
          specifications
        }
      },
      c4Specification
    } = doc

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
        const bodyProps = pipe(
          props.filter(ast.isSpecificationElementStringProperty) ?? [],
          filter(p => isValid(p) && isNonNullish(p.value)),
          mapToObj(p => [p.key, removeIndent(p.value)] satisfies [string, string])
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
        const bodyProps = pipe(
          props.filter(ast.isSpecificationRelationshipStringProperty) ?? [],
          filter(p => isValid(p) && isNonNullish(p.value)),
          mapToObj(p => [p.key, removeIndent(p.value)] satisfies [string, string])
        )
        c4Specification.relationships[kindName] = {
          ...bodyProps,
          ...toRelationshipStyleExcludeDefaults(props, isValid)
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

    const deploymentNodes_specs = specifications.flatMap(s => s.deploymentNodes.filter(isValid))
    for (const deploymentNode of deploymentNodes_specs) {
      try {
        Object.assign(c4Specification.deployments, this.parseSpecificationDeploymentNodeKind(deploymentNode, isValid))
      } catch (e) {
        logWarnError(e)
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

  private parseSpecificationDeploymentNodeKind(
    { kind, props }: ast.SpecificationDeploymentNodeKind,
    isValid: IsValidFn
  ): { [key: c4.DeploymentNodeKind]: c4.DeploymentNodeKindSpecification } {
    const kindName = kind.name as c4.DeploymentNodeKind
    if (!isTruthy(kindName)) {
      throw new Error('DeploymentNodeKind name is not resolved')
    }

    const style = props.find(ast.isElementStyleProperty)
    const bodyProps = pipe(
      props.filter(ast.isSpecificationElementStringProperty) ?? [],
      filter(p => isValid(p) && isNonNullish(p.value)),
      mapToObj(p => [p.key, removeIndent(p.value)] satisfies [string, string])
    )
    return {
      [kindName]: {
        ...bodyProps,
        style: {
          ...toElementStyle(style?.props, isValid)
        }
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
          doc.c4Relations.push(this.parseRelation(el, isValid))
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
    const kind = nonNullable(astNode.kind.ref, 'Element kind is not resolved').name as c4.ElementKind
    const tags = this.convertTags(astNode.body)
    const stylePropsAst = astNode.body?.props.find(ast.isElementStyleProperty)?.props
    const style = toElementStyle(stylePropsAst, isValid)
    const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))
    const astPath = this.getAstNodePath(astNode)

    let [title, description, technology] = astNode.props ?? []

    const bodyProps = pipe(
      astNode.body?.props ?? [],
      filter(isValid),
      filter(ast.isElementStringProperty),
      mapToObj(p => [p.key, p.value || undefined])
    )

    title = toSingleLine(title ?? bodyProps.title)
    description = removeIndent(bodyProps.description ?? description)
    technology = toSingleLine(bodyProps.technology ?? technology)

    const links = this.convertLinks(astNode.body)

    // Property has higher priority than from style
    const iconProp = astNode.body?.props.find(ast.isIconProperty)
    if (iconProp && isValid(iconProp)) {
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

  private parseRelation(astNode: ast.Relation, isValid: IsValidFn): ParsedAstRelation {
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
    const technology = toSingleLine(astNode.technology) ?? removeIndent(bodyProps.technology)

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
      ...toRelationshipStyleExcludeDefaults(styleProp?.props, isValid),
      ...(navigateTo && { navigateTo: navigateTo as c4.ViewID })
    }
  }

  private parseGlobal(doc: ParsedLikeC4LangiumDocument, isValid: IsValidFn) {
    const { parseResult, c4Globals } = doc

    const globals = parseResult.value.globals.filter(isValid)

    const elRelPredicates = globals.flatMap(r => r.predicates.filter(isValid))
    for (const predicate of elRelPredicates) {
      try {
        const globalPredicateId = predicate.name as c4.GlobalPredicateId
        if (!isTruthy(globalPredicateId)) {
          continue
        }
        if (globalPredicateId in c4Globals.predicates) {
          logger.warn(`Global predicate named "${globalPredicateId}" is already defined`)
          continue
        }

        this.parseAndStoreGlobalPredicateGroupOrDynamic(predicate, globalPredicateId, c4Globals, isValid)
      } catch (e) {
        logWarnError(e)
      }
    }

    const styles = globals.flatMap(r => r.styles.filter(isValid))
    for (const style of styles) {
      try {
        const globalStyleId = style.id.name as c4.GlobalStyleID
        if (!isTruthy(globalStyleId)) {
          continue
        }
        if (globalStyleId in c4Globals.styles) {
          logger.warn(`Global style named "${globalStyleId}" is already defined`)
          continue
        }

        const styles = this.parseGlobalStyleOrGroup(style, isValid)
        if (styles.length > 0) {
          c4Globals.styles[globalStyleId] = styles as c4.NonEmptyArray<c4.ViewRuleStyle>
        }
      } catch (e) {
        logWarnError(e)
      }
    }
  }

  private parseAndStoreGlobalPredicateGroupOrDynamic(
    astRule: ast.GlobalPredicateGroup | ast.GlobalDynamicPredicateGroup,
    id: c4.GlobalPredicateId,
    c4Globals: ParsedAstGlobals,
    isValid: IsValidFn
  ) {
    if (ast.isGlobalPredicateGroup(astRule)) {
      const predicates = this.parseGlobalPredicateGroup(astRule, isValid)
      if (predicates.length > 0) {
        c4Globals.predicates[id] = predicates as c4.NonEmptyArray<c4.ViewRulePredicate>
      }
      return
    }
    if (ast.isGlobalDynamicPredicateGroup(astRule)) {
      const predicates = this.parseGlobalDynamicPredicateGroup(astRule, isValid)
      if (predicates.length > 0) {
        c4Globals.dynamicPredicates[id] = predicates as c4.NonEmptyArray<c4.DynamicViewIncludeRule>
      }
      return
    }
    nonexhaustive(astRule)
  }

  private parseGlobalPredicateGroup(
    astRule: ast.GlobalPredicateGroup,
    isValid: IsValidFn
  ): c4.ViewRulePredicate[] {
    return astRule.predicates.map(p => this.parseViewRulePredicate(p, isValid))
  }

  private parseGlobalDynamicPredicateGroup(
    astRule: ast.GlobalDynamicPredicateGroup,
    isValid: IsValidFn
  ): c4.DynamicViewIncludeRule[] {
    return astRule.predicates.map(p => this.parseDynamicViewIncludePredicate(p, isValid))
  }

  private parseGlobalStyleOrGroup(
    astRule: ast.GlobalStyle | ast.GlobalStyleGroup,
    isValid: IsValidFn
  ): c4.ViewRuleStyle[] {
    if (ast.isGlobalStyle(astRule)) {
      return [this.parseViewRuleStyle(astRule, isValid)]
    }
    if (ast.isGlobalStyleGroup(astRule)) {
      return astRule.styles.map(s => this.parseViewRuleStyle(s, isValid))
    }
    nonexhaustive(astRule)
  }

  private parseViews(doc: ParsedLikeC4LangiumDocument, isValid: IsValidFn) {
    for (const viewBlock of doc.parseResult.value.views) {
      const localStyles = viewBlock.styles.flatMap(s => {
        try {
          return isValid(s) ? this.parseViewRuleStyleOrGlobalRef(s, isValid) : []
        } catch (e) {
          logWarnError(e)
          return []
        }
      })

      for (const view of viewBlock.views) {
        try {
          if (!isValid(view)) {
            continue
          }
          switch (true) {
            case ast.isElementView(view):
              doc.c4Views.push(this.parseElementView(view, localStyles, isValid))
              break
            case ast.isDynamicView(view):
              doc.c4Views.push(this.parseDynamicElementView(view, localStyles, isValid))
              break
            case ast.isDeploymentView(view):
              doc.c4Views.push(this.parseDeploymentView(view, isValid))
              break
            default:
              nonexhaustive(view)
          }
        } catch (e) {
          logWarnError(e)
        }
      }
    }
  }

  // TODO validate view rules
  private parseViewRulePredicate(astNode: ast.ViewRulePredicate, _isValid: IsValidFn): c4.ViewRulePredicate {
    const exprs = [] as c4.Expression[]
    let predicate = astNode.predicates
    while (predicate) {
      const { value, prev } = predicate
      try {
        if (isTruthy(value) && _isValid(value as any)) {
          exprs.unshift(this.parsePredicate(value, _isValid))
        }
      } catch (e) {
        logWarnError(e)
      }
      if (!prev) {
        break
      }
      predicate = prev
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
      invariant(astNode.kind?.ref, 'ElementKindExpr kind is not resolved: ' + astNode.$cstNode?.text)
      return {
        elementKind: astNode.kind.ref.name as c4.ElementKind,
        isEqual: astNode.isEqual
      }
    }
    if (ast.isElementTagExpression(astNode)) {
      invariant(astNode.tag?.ref, 'ElementTagExpr tag is not resolved: ' + astNode.$cstNode?.text)
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
        if (!_isValid(prop)) {
          return acc
        }
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
      let relation = ast.isRelationPredicateWhere(astNode.subject)
        ? this.parseRelationPredicateWhere(astNode.subject)
        : this.parseRelationExpr(astNode.subject)

      return this.parseRelationPredicateWith(astNode, relation)
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
    relation: c4.RelationExpression | c4.RelationWhereExpr
  ): c4.CustomRelationExpr {
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

  private parseViewRule(astRule: ast.ViewRule, isValid: IsValidFn): c4.ViewRule {
    if (ast.isViewRulePredicate(astRule)) {
      return this.parseViewRulePredicate(astRule, isValid)
    }
    if (ast.isViewRuleGlobalPredicateRef(astRule)) {
      return this.parseViewRuleGlobalPredicateRef(astRule, isValid)
    }
    if (ast.isViewRuleStyleOrGlobalRef(astRule)) {
      return this.parseViewRuleStyleOrGlobalRef(astRule, isValid)
    }
    if (ast.isViewRuleAutoLayout(astRule)) {
      return toAutoLayout(astRule)
    }
    if (ast.isViewRuleGroup(astRule)) {
      return this.parseViewRuleGroup(astRule, isValid)
    }
    nonexhaustive(astRule)
  }

  private parseViewRuleGlobalPredicateRef(
    astRule: ast.ViewRuleGlobalPredicateRef | ast.DynamicViewGlobalPredicateRef,
    _isValid: IsValidFn
  ): c4.ViewRuleGlobalPredicateRef {
    return {
      predicateId: astRule.predicate.$refText as c4.GlobalPredicateId
    }
  }

  private parseViewRuleStyleOrGlobalRef(
    astRule: ast.ViewRuleStyleOrGlobalRef,
    isValid: IsValidFn
  ): c4.ViewRuleStyleOrGlobalRef {
    if (ast.isViewRuleStyle(astRule)) {
      return this.parseViewRuleStyle(astRule, isValid)
    }
    if (ast.isViewRuleGlobalStyle(astRule)) {
      return this.parseViewRuleGlobalStyle(astRule, isValid)
    }
    nonexhaustive(astRule)
  }

  private parseViewRuleStyle(astRule: ast.ViewRuleStyle | ast.GlobalStyle, isValid: IsValidFn): c4.ViewRuleStyle {
    const styleProps = astRule.props.filter(ast.isStyleProperty)
    const targets = astRule.target
    const notation = astRule.props.find(ast.isNotationProperty)
    return this.parseRuleStyle(styleProps, targets, isValid, notation)
  }

  private parseViewRuleGroup(astNode: ast.ViewRuleGroup, _isValid: IsValidFn): c4.ViewRuleGroup {
    const groupRules = [] as c4.ViewRuleGroup['groupRules']
    for (const rule of astNode.groupRules) {
      try {
        if (!_isValid(rule)) {
          continue
        }
        if (ast.isViewRulePredicate(rule)) {
          groupRules.push(this.parseViewRulePredicate(rule, _isValid))
          continue
        }
        if (ast.isViewRuleGroup(rule)) {
          groupRules.push(this.parseViewRuleGroup(rule, _isValid))
          continue
        }
        nonexhaustive(rule)
      } catch (e) {
        logWarnError(e)
      }
    }
    return {
      title: toSingleLine(astNode.title) ?? null,
      groupRules,
      ...toElementStyle(astNode.props, _isValid)
    }
  }

  private parseRuleStyle(
    styleProperties: ast.StyleProperty[],
    elementExpressionsIterator: ast.ElementExpressionsIterator,
    isValid: IsValidFn,
    notationProperty?: NotationProperty
  ): c4.ViewRuleStyle {
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

  private parseViewRuleGlobalStyle(astRule: ast.ViewRuleGlobalStyle, _isValid: IsValidFn): c4.ViewRuleGlobalStyle {
    return {
      styleId: astRule.style.$refText as c4.GlobalStyleID
    }
  }

  private parseViewManualLayout(node: ast.LikeC4View): c4.ViewManualLayout | undefined {
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
    if (!isArray(node.custom?.props)) {
      return step
    }
    for (const prop of node.custom.props) {
      try {
        switch (true) {
          case ast.isRelationStringProperty(prop):
          case ast.isNotationProperty(prop):
          case ast.isNotesProperty(prop): {
            if (isDefined(prop.value)) {
              step[prop.key] = removeIndent(prop.value) ?? ''
            }
            break
          }
          case ast.isArrowProperty(prop): {
            if (isDefined(prop.value)) {
              step[prop.key] = prop.value
            }
            break
          }
          case ast.isColorProperty(prop): {
            const value = toColor(prop)
            if (isDefined(value)) {
              step[prop.key] = value
            }
            break
          }
          case ast.isLineProperty(prop): {
            if (isDefined(prop.value)) {
              step[prop.key] = prop.value
            }
            break
          }
          case ast.isRelationNavigateToProperty(prop): {
            const viewId = prop.value.view.ref?.name
            if (isTruthy(viewId)) {
              step.navigateTo = viewId as c4.ViewID
            }
            break
          }
          default:
            nonexhaustive(prop)
        }
      }
      catch (e) {
        logWarnError(e)
      }
    }
    return step
  }

  private parseElementView(
    astNode: ast.ElementView,
    additionalStyles: c4.ViewRuleStyleOrGlobalRef[],
    isValid: IsValidFn
  ): ParsedAstElementView {
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

    const manualLayout = this.parseViewManualLayout(astNode)

    const view: ParsedAstElementView = {
      __: 'element',
      id: id as c4.ViewID,
      astPath,
      title,
      description,
      tags,
      links: isNonEmptyArray(links) ? links : null,
      rules: [
        ...additionalStyles,
        ...body.rules.flatMap(n => {
          try {
            return isValid(n) ? this.parseViewRule(n, isValid) : []
          } catch (e) {
            logWarnError(e)
            return []
          }
        })
      ],
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

  private parseDynamicElementView(
    astNode: ast.DynamicView,
    additionalStyles: c4.ViewRuleStyleOrGlobalRef[],
    isValid: IsValidFn
  ): ParsedAstDynamicView {
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

    const manualLayout = this.parseViewManualLayout(astNode)

    return {
      __: 'dynamic',
      id: id as c4.ViewID,
      astPath,
      title,
      description,
      tags,
      links: isNonEmptyArray(links) ? links : null,
      rules: [
        ...additionalStyles,
        ...body.rules.flatMap(n => {
          try {
            return isValid(n) ? this.parseDynamicViewRule(n, isValid) : []
          } catch (e) {
            logWarnError(e)
            return []
          }
        }, [] as Array<c4.DynamicViewRule>)
      ],
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

  private parseDynamicViewRule(astRule: ast.DynamicViewRule, isValid: IsValidFn): c4.DynamicViewRule {
    if (ast.isDynamicViewIncludePredicate(astRule)) {
      return this.parseDynamicViewIncludePredicate(astRule, isValid)
    }
    if (ast.isDynamicViewGlobalPredicateRef(astRule)) {
      return this.parseViewRuleGlobalPredicateRef(astRule, isValid)
    }
    if (ast.isViewRuleStyleOrGlobalRef(astRule)) {
      return this.parseViewRuleStyleOrGlobalRef(astRule, isValid)
    }
    if (ast.isViewRuleAutoLayout(astRule)) {
      return toAutoLayout(astRule)
    }
    nonexhaustive(astRule)
  }

  private parseDynamicViewIncludePredicate(
    astRule: ast.DynamicViewIncludePredicate,
    isValid: IsValidFn
  ): c4.DynamicViewIncludeRule {
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
    return { include }
  }

  private parseDeployment(doc: ParsedLikeC4LangiumDocument, isValid: IsValidFn) {
    type TraversePair = ast.DeployedInstance | ast.DeploymentNode | ast.DeploymentRelation
    const traverseStack: TraversePair[] = doc.parseResult.value.deployments.flatMap(d => d.elements)

    let next: TraversePair | undefined
    while (!!(next = traverseStack.shift())) {
      if (ast.isDeploymentRelation(next) || !isValid(next)) {
        continue
      }
      try {
        switch (true) {
          case ast.isDeployedInstance(next):
            doc.c4Deployments.push(this.parseDeployedInstance(next, isValid))
            break
          case ast.isDeploymentNode(next): {
            doc.c4Deployments.push(this.parseDeploymentNode(next, isValid))
            if (next.body && next.body.elements.length > 0) {
              traverseStack.push(...next.body.elements)
            }
            break
          }
          default:
            nonexhaustive(next)
        }
      } catch (e) {
        logWarnError(e)
      }
    }
  }

  public parseDeploymentNode(
    astNode: ast.DeploymentNode,
    isValid: IsValidFn
  ): ParsedAstDeployment.Node {
    const id = this.resolveFqn(astNode)
    const kind = nonNullable(astNode.kind.ref, 'DeploymentKind not resolved').name as c4.DeploymentNodeKind
    const tags = this.convertTags(astNode.body)
    const stylePropsAst = astNode.body?.props.find(ast.isElementStyleProperty)?.props
    const style = toElementStyle(stylePropsAst, isValid)
    const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))

    const bodyProps = pipe(
      astNode.body?.props ?? [],
      filter(isValid),
      filter(ast.isElementStringProperty),
      mapToObj(p => [p.key, p.value || undefined])
    )

    const title = toSingleLine(astNode.title ?? bodyProps.title)
    const description = removeIndent(bodyProps.description)
    const technology = toSingleLine(bodyProps.technology)

    const links = this.convertLinks(astNode.body)

    // Property has higher priority than from style
    const iconProp = astNode.body?.props.find(ast.isIconProperty)
    if (iconProp && isValid(iconProp)) {
      const value = iconProp.libicon?.ref?.name ?? iconProp.value
      if (isTruthy(value)) {
        style.icon = value as c4.IconUrl
      }
    }

    return {
      id,
      kind,
      title: title ?? nameFromFqn(id),
      ...(metadata && { metadata }),
      ...(tags && { tags }),
      ...(links && isNonEmptyArray(links) && { links }),
      ...(isTruthy(technology) && { technology }),
      ...(isTruthy(description) && { description }),
      style
    }
  }

  public parseDeployedInstance(
    astNode: ast.DeployedInstance,
    isValid: IsValidFn
  ): ParsedAstDeployment.Instance {
    const id = this.resolveFqn(astNode)
    const element = this.resolveFqn(nonNullable(elementRef(astNode.element), 'DeployedInstance element not found'))

    const tags = this.convertTags(astNode.body)
    const stylePropsAst = astNode.body?.props.find(ast.isElementStyleProperty)?.props
    const style = toElementStyle(stylePropsAst, isValid)
    const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty))

    const bodyProps = pipe(
      astNode.body?.props ?? [],
      filter(isValid),
      filter(ast.isElementStringProperty),
      mapToObj(p => [p.key, p.value || undefined])
    )

    const title = toSingleLine(astNode.title ?? bodyProps.title)
    const description = removeIndent(bodyProps.description)
    const technology = toSingleLine(bodyProps.technology)

    const links = this.convertLinks(astNode.body)

    // Property has higher priority than from style
    const iconProp = astNode.body?.props.find(ast.isIconProperty)
    if (iconProp && isValid(iconProp)) {
      const value = iconProp.libicon?.ref?.name ?? iconProp.value
      if (isTruthy(value)) {
        style.icon = value as c4.IconUrl
      }
    }

    return {
      id,
      element,
      ...(metadata && { metadata }),
      ...(title && { title }),
      ...(tags && { tags }),
      ...(links && isNonEmptyArray(links) && { links }),
      ...(isTruthy(technology) && { technology }),
      ...(isTruthy(description) && { description }),
      style
    }
  }

  private parseDeploymentView(
    astNode: ast.DeploymentView,
    isValid: IsValidFn
  ): ParsedAstDeploymentView {
    const body = astNode.body
    invariant(body, 'DynamicElementView body is not defined')
    // only valid props
    const props = body.props.filter(isValid)
    const astPath = this.getAstNodePath(astNode)

    let id = astNode.name
    if (!id) {
      id = 'deployment_' + stringHash(
        getDocument(astNode).uri.toString(),
        astPath
      ) as c4.ViewID
    }

    const title = toSingleLine(props.find(p => p.key === 'title')?.value) ?? null
    const description = removeIndent(props.find(p => p.key === 'description')?.value) ?? null

    const tags = this.convertTags(body)
    const links = this.convertLinks(body)

    ViewOps.writeId(astNode, id as c4.ViewID)

    const manualLayout = this.parseViewManualLayout(astNode)

    return {
      __: 'deployment',
      id: id as c4.ViewID,
      astPath,
      title,
      description,
      tags,
      links: isNonEmptyArray(links) ? links : null,
      rules: body.rules.flatMap(n => {
        try {
          return isValid(n) ? this.parseDeploymentViewRule(n, isValid) : []
        } catch (e) {
          logWarnError(e)
          return []
        }
      }),
      ...(manualLayout && { manualLayout })
    }
  }

  private parseDeploymentViewRule(astRule: ast.DeploymentViewRule, isValid: IsValidFn): c4.DeploymentViewRule {
    if (ast.isDeploymentViewRulePredicate(astRule)) {
      return this.parseDeploymentViewRulePredicate(astRule, isValid)
    }
    if (ast.isViewRuleAutoLayout(astRule)) {
      return toAutoLayout(astRule)
    }
    if (ast.isDeploymentViewRuleStyle(astRule)) {
      return this.parseDeploymentViewRuleStyle(astRule, isValid)
    }
    nonexhaustive(astRule)
  }

  private parseDeploymentViewRulePredicate(
    astRule: ast.DeploymentViewRulePredicate,
    isValid: IsValidFn
  ): c4.DeploymentViewRulePredicate {
    const exprs = [] as c4.DeploymentExpression[]
    while (true) {
      try {
        if (isValid(astRule.expr)) {
          switch (true) {
            case ast.isDeploymentElementExpression(astRule.expr):
              exprs.unshift(this.parseDeploymentElementExpression(astRule.expr))
              break
            case ast.isDeploymentRelationExpression(astRule.expr):
              exprs.unshift(this.parseDeploymentRelationExpression(astRule.expr))
              break
            default:
              nonexhaustive(astRule.expr)
          }
        }
      } catch (e) {
        logWarnError(e)
      }
      if (!astRule.prev) {
        break
      }
      astRule = astRule.prev
    }
    return astRule.isInclude ? { include: exprs } : { exclude: exprs }
  }

  private parseDeploymentElementExpression(astNode: ast.DeploymentElementExpression): c4.DeploymentExpression {
    if (ast.isWildcardExpression(astNode)) {
      return {
        wildcard: true
      }
    }
    if (ast.isDeploymentRefExpression(astNode)) {
      const ref = this.parseDeploymentDef(astNode.ref)
      switch (true) {
        case astNode.isExpand:
          return {
            ref,
            isExpanded: true
          }
        case astNode.isNested:
          return {
            ref,
            isNested: true
          }
        default:
          return { ref }
      }
    }
    nonexhaustive(astNode)
  }

  private parseDeploymentRelationExpression(
    astNode: ast.DeploymentRelationExpression
  ): c4.DeploymentRelationExpression {
    if (ast.isDirectedDeploymentRelationExpression(astNode)) {
      return {
        source: this.parseDeploymentElementExpression(astNode.source.from),
        target: this.parseDeploymentElementExpression(astNode.target),
        isBidirectional: astNode.source.isBidirectional
      }
    }
    if (ast.isInOutDeploymentRelationExpression(astNode)) {
      return {
        inout: this.parseDeploymentElementExpression(astNode.inout.to)
      }
    }
    if (ast.isOutgoingDeploymentRelationExpression(astNode)) {
      return {
        outgoing: this.parseDeploymentElementExpression(astNode.from)
      }
    }
    if (ast.isIncomingDeploymentRelationExpression(astNode)) {
      return {
        incoming: this.parseDeploymentElementExpression(astNode.to)
      }
    }
    nonexhaustive(astNode)
  }

  private parseDeploymentExpressionIterator(
    astNode: ast.DeploymentExpressionIterator,
    isValid: IsValidFn
  ): c4.DeploymentExpression[] {
    const exprs = [] as c4.DeploymentExpression[]
    let iter: ast.DeploymentExpressionIterator['prev'] = astNode
    while (iter) {
      try {
        if (isValid(astNode.value)) {
          exprs.unshift(this.parseDeploymentElementExpression(astNode.value))
        }
      } catch (e) {
        logWarnError(e)
      }
      iter = iter.prev
    }
    return exprs
  }

  private parseDeploymentDef(astNode: ast.DeploymentRef): c4.DeploymentRef {
    const refValue = nonNullable(astNode.value.ref, 'Deployment ref is empty')

    if (ast.isDeploymentNode(refValue)) {
      return {
        node: this.resolveFqn(refValue)
      }
    }
    const deployedInstanceAst = nonNullable(instanceRef(astNode), 'Instance ref not found')
    const instance = this.resolveFqn(deployedInstanceAst)

    if (ast.isElement(refValue)) {
      const element = this.resolveFqn(refValue)
      return {
        instance,
        element
      }
    }

    // To ensure with compiler we processed all types
    invariant(ast.isDeployedInstance(refValue), 'Invalid deployment ref: ' + this.getAstNodePath(astNode))
    return {
      instance
    }
  }

  protected parseDeploymentViewRuleStyle(
    astRule: ast.DeploymentViewRuleStyle,
    isValid: IsValidFn
  ): c4.DeploymentViewRuleStyle {
    const styleProps = astRule.props.filter(ast.isStyleProperty)
    const notationProperty = astRule.props.find(ast.isNotationProperty)
    const notation = removeIndent(notationProperty?.value)
    const targets = this.parseDeploymentExpressionIterator(astRule.target, isValid)
    return {
      targets,
      ...(notation && { notation }),
      style: {
        ...toElementStyle(styleProps, isValid)
      }
    }
  }

  protected resolveFqn(node: ast.FqnReferenceable): c4.Fqn {
    if (ast.isDeploymentNode(node) || ast.isDeployedInstance(node)) {
      return this.services.likec4.DeploymentsIndex.getFqnName(node)
    }
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
