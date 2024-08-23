import {
  type c4,
  DefaultArrowType,
  DefaultLineStyle,
  DefaultRelationshipColor,
  nonexhaustive,
  NullableError,
  RelationRefError
} from '@likec4/core'
import type { AstNode, AstNodeDescription, DiagnosticInfo, LangiumDocument, MultiMap } from 'langium'
import { DocumentState } from 'langium'
import { clamp, isNullish, isTruthy } from 'remeda'
import type { ConditionalPick, SetRequired, ValueOf } from 'type-fest'
import type { Diagnostic } from 'vscode-languageserver-types'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { elementRef } from './elementRef'
import type { LikeC4Grammar } from './generated/ast'
import * as ast from './generated/ast'
import { LikeC4LanguageMetaData } from './generated/module'

export { ast }

const idattr = Symbol.for('idattr')

declare module './generated/ast' {
  export interface Element {
    [idattr]?: c4.Fqn | undefined
  }
  export interface ElementView {
    [idattr]?: c4.ViewID | undefined
  }
  export interface DynamicView {
    [idattr]?: c4.ViewID | undefined
  }
}

type ParsedElementStyle = {
  shape?: c4.ElementShape
  icon?: c4.IconUrl
  color?: c4.ThemeColor
  border?: c4.BorderStyle
  opacity?: number
}

export interface ParsedAstSpecification {
  kinds: Record<c4.ElementKind, ParsedElementStyle>
  relationships: Record<
    c4.RelationshipKind,
    {
      color?: c4.ThemeColor
      line?: c4.RelationshipLineType
      head?: c4.RelationshipArrowType
      tail?: c4.RelationshipArrowType
    }
  >
}

export interface ParsedAstElement {
  id: c4.Fqn
  astPath: string
  kind: c4.ElementKind
  title: string
  description?: string
  technology?: string
  tags?: c4.NonEmptyArray<c4.Tag>
  links?: c4.NonEmptyArray<string>
  style: ParsedElementStyle
  metadata?: { [key: string]: string }
}

export interface ParsedAstRelation {
  id: c4.RelationID
  astPath: string
  source: c4.Fqn
  target: c4.Fqn
  kind?: c4.RelationshipKind
  tags?: c4.NonEmptyArray<c4.Tag>
  title: string
  description?: string
  technology?: string
  color?: c4.ThemeColor
  line?: c4.RelationshipLineType
  head?: c4.RelationshipArrowType
  tail?: c4.RelationshipArrowType
  links?: c4.NonEmptyArray<string>
  metadata?: { [key: string]: string }
}

export interface ParsedAstElementView {
  __: 'element'
  id: c4.ViewID
  viewOf?: c4.Fqn
  extends?: c4.ViewID
  astPath: string
  title: string | null
  description: string | null
  tags: c4.NonEmptyArray<c4.Tag> | null
  links: c4.NonEmptyArray<string> | null
  rules: c4.ViewRule[]
  manualLayout?: c4.ViewManualLayout
}

export interface ParsedAstDynamicView {
  __: 'dynamic'
  id: c4.ViewID
  astPath: string
  title: string | null
  description: string | null
  tags: c4.NonEmptyArray<c4.Tag> | null
  links: c4.NonEmptyArray<string> | null
  steps: c4.DynamicViewStep[]
  rules: Array<c4.DynamicViewRule>
  manualLayout?: c4.ViewManualLayout
}

export type ParsedAstView = ParsedAstElementView | ParsedAstDynamicView
export const ViewOps = {
  writeId<T extends ast.LikeC4View>(node: T, id: c4.ViewID): T {
    node[idattr] = id
    return node
  },
  readId(node: ast.LikeC4View): c4.ViewID | undefined {
    return node[idattr]
  }
}

export const ElementOps = {
  writeId(node: ast.Element, id: c4.Fqn | null) {
    if (isNullish(id)) {
      node[idattr] = undefined
    } else {
      node[idattr] = id
    }
    return node
  },
  readId(node: ast.Element) {
    return node[idattr]
  }
}

export interface DocFqnIndexAstNodeDescription extends AstNodeDescription {
  fqn: c4.Fqn
}

// export type LikeC4AstNode = ast.LikeC4AstType[keyof ast.LikeC4AstType]
export type LikeC4AstNode = ValueOf<ConditionalPick<ast.LikeC4AstType, AstNode>>
type LikeC4DocumentDiagnostic = Diagnostic & DiagnosticInfo<LikeC4AstNode>

export interface LikeC4DocumentProps {
  diagnostics?: Array<LikeC4DocumentDiagnostic>
  c4Specification?: ParsedAstSpecification
  c4Elements?: ParsedAstElement[]
  c4Relations?: ParsedAstRelation[]
  c4Views?: ParsedAstView[]
  // Fqn -> Element
  c4fqnIndex?: MultiMap<c4.Fqn, DocFqnIndexAstNodeDescription>
}

export interface LikeC4LangiumDocument
  extends Omit<LangiumDocument<LikeC4Grammar>, 'diagnostics'>, LikeC4DocumentProps
{}
export interface FqnIndexedDocument
  extends Omit<LangiumDocument<LikeC4Grammar>, 'diagnostics'>, SetRequired<LikeC4DocumentProps, 'c4fqnIndex'>
{}

// export type ParsedLikeC4LangiumDocument = SetRequired<FqnIndexedDocument, keyof  LikeC4DocumentProps>
export interface ParsedLikeC4LangiumDocument
  extends Omit<LangiumDocument<LikeC4Grammar>, 'diagnostics'>, Required<LikeC4DocumentProps>
{}

export function cleanParsedModel(doc: LikeC4LangiumDocument) {
  const props: Required<Omit<LikeC4DocumentProps, 'c4fqnIndex' | 'diagnostics'>> = {
    c4Specification: {
      kinds: {},
      relationships: {}
    },
    c4Elements: [],
    c4Relations: [],
    c4Views: []
  }
  return Object.assign(doc, props) as ParsedLikeC4LangiumDocument
}

export function isFqnIndexedDocument(doc: LangiumDocument): doc is FqnIndexedDocument {
  return isLikeC4LangiumDocument(doc) && doc.state >= DocumentState.IndexedContent && !!doc.c4fqnIndex
}

export function isLikeC4LangiumDocument(doc: LangiumDocument): doc is LikeC4LangiumDocument {
  return doc.textDocument.languageId === LikeC4LanguageMetaData.languageId
}

export function isParsedLikeC4LangiumDocument(
  doc: LangiumDocument
): doc is ParsedLikeC4LangiumDocument {
  return (
    isLikeC4LangiumDocument(doc)
    && doc.state == DocumentState.Validated
    && !!doc.c4Specification
    && !!doc.c4Elements
    && !!doc.c4Relations
    && !!doc.c4Views
    && !!doc.c4fqnIndex
  )
}

type Guard<N extends AstNode> = (n: AstNode) => n is N
type Guarded<G> = G extends Guard<infer N> ? N : never

function validatableAstNodeGuards<const Predicates extends Guard<AstNode>[]>(
  predicates: Predicates
) {
  return (n: AstNode): n is Guarded<Predicates[number]> => predicates.some(p => p(n))
}
const isValidatableAstNode = validatableAstNodeGuards([
  ast.isDynamicViewPredicateIterator,
  ast.isElementPredicateWith,
  ast.isRelationPredicateWith,
  ast.isElementExpression,
  ast.isRelationExpression,
  ast.isDynamicViewStep,
  ast.isViewProperty,
  ast.isStyleProperty,
  ast.isTags,
  ast.isViewRule,
  ast.isDynamicViewRule,
  ast.isElementViewBody,
  ast.isDynamicViewBody,
  ast.isLikeC4View,
  ast.isRelationProperty,
  ast.isRelationBody,
  ast.isRelation,
  ast.isElementProperty,
  ast.isElementBody,
  ast.isElement,
  ast.isExtendElementBody,
  ast.isExtendElement,
  ast.isSpecificationElementKind,
  ast.isSpecificationRelationshipKind,
  ast.isSpecificationTag,
  ast.isSpecificationRule,
  ast.isModelViews,
  ast.isModel
])
type ValidatableAstNode = Guarded<typeof isValidatableAstNode>

const findInvalidContainer = (node: LikeC4AstNode): ValidatableAstNode | undefined => {
  let nd = node as LikeC4AstNode['$container']
  while (nd) {
    if (isValidatableAstNode(nd)) {
      return nd
    }
    nd = nd.$container
  }
  return
}

export function checksFromDiagnostics(doc: LikeC4LangiumDocument) {
  const errors = doc.diagnostics?.filter(d => d.severity === DiagnosticSeverity.Error) ?? []
  const invalidNodes = new WeakSet(
    errors.flatMap(d => {
      return findInvalidContainer(d.node) ?? []
    })
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isValid = (n: ValidatableAstNode) => !invalidNodes.has(n)
  return {
    isValid,
    invalidNodes
  }
}
export type ChecksFromDiagnostics = ReturnType<typeof checksFromDiagnostics>

export function* streamModel(doc: LikeC4LangiumDocument, isValid: ChecksFromDiagnostics['isValid']) {
  const traverseStack = doc.parseResult.value.models.flatMap(m => (isValid(m) ? m.elements : []))
  const relations = [] as ast.Relation[]
  let el
  while ((el = traverseStack.shift())) {
    if (!isValid(el)) {
      continue
    }
    if (ast.isRelation(el)) {
      relations.push(el)
      continue
    }
    if (ast.isExtendElement(el)) {
      if (el.body && el.body.elements.length > 0) {
        traverseStack.push(...el.body.elements)
      }
      continue
    }
    if (el.body && el.body.elements.length > 0) {
      for (const nested of el.body.elements) {
        if (ast.isRelation(nested)) {
          relations.push(nested)
        } else {
          traverseStack.push(nested)
        }
      }
    }
    yield el
  }
  for (const relation of relations) {
    yield relation
  }
}

export function resolveRelationPoints(node: ast.Relation): {
  source: ast.Element
  target: ast.Element
} {
  const target = elementRef(node.target)
  if (!target) {
    throw new RelationRefError('Invalid reference to target')
  }
  if (ast.isExplicitRelation(node)) {
    const source = elementRef(node.source)
    if (!source) {
      throw new RelationRefError('Invalid reference to source')
    }
    return {
      source,
      target
    }
  }
  return {
    source: node.$container.$container,
    target
  }
}

export function parseAstOpacityProperty({ value }: ast.OpacityProperty): number {
  const opacity = parseFloat(value)
  return isNaN(opacity) ? 100 : clamp(opacity, { min: 0, max: 100 })
}

export function toElementStyle(props?: Array<ast.StyleProperty>) {
  const result = {} as ParsedElementStyle
  if (!props || props.length === 0) {
    return result
  }
  for (const prop of props) {
    switch (true) {
      case ast.isBorderProperty(prop): {
        result.border = prop.value
        break
      }
      case ast.isColorProperty(prop): {
        result.color = prop.value
        break
      }
      case ast.isShapeProperty(prop): {
        result.shape = prop.value
        break
      }
      case ast.isIconProperty(prop): {
        const icon = prop.libicon?.ref?.name ?? prop.value
        if (isTruthy(icon)) {
          result.icon = icon as c4.IconUrl
        }
        break
      }
      case ast.isOpacityProperty(prop): {
        result.opacity = parseAstOpacityProperty(prop)
        break
      }
      default:
        // @ts-expect-error
        nonexhaustive(prop.$type)
    }
  }
  return result
}

export function toRelationshipStyle(props?: ast.SpecificationRelationshipKind['props']) {
  const result = {} as {
    color?: c4.ThemeColor
    line?: c4.RelationshipLineType
    head?: c4.RelationshipArrowType
    tail?: c4.RelationshipArrowType
  }
  if (!props || props.length === 0) {
    return result
  }
  for (const prop of props) {
    if (ast.isColorProperty(prop)) {
      result.color = prop.value
      continue
    }
    if (ast.isLineProperty(prop)) {
      result.line = prop.value
      continue
    }
    if (ast.isArrowProperty(prop)) {
      switch (prop.key) {
        case 'head': {
          result.head = prop.value
          break
        }
        case 'tail': {
          result.tail = prop.value
          break
        }
        default: {
          nonexhaustive(prop)
        }
      }
      continue
    }
    nonexhaustive(prop)
  }
  return result
}

export function toRelationshipStyleExcludeDefaults(
  props?: ast.SpecificationRelationshipKind['props']
) {
  const { color, line, head, tail } = toRelationshipStyle(props)
  return {
    ...(color && color !== DefaultRelationshipColor ? { color } : {}),
    ...(line && line !== DefaultLineStyle ? { line } : {}),
    ...(head && head !== DefaultArrowType ? { head } : {}),
    ...(tail ? { tail } : {})
  }
}

export function toAutoLayout(
  direction: ast.ViewLayoutDirection
): c4.ViewRuleAutoLayout['autoLayout'] {
  switch (direction) {
    case 'TopBottom': {
      return 'TB'
    }
    case 'BottomTop': {
      return 'BT'
    }
    case 'LeftRight': {
      return 'LR'
    }
    case 'RightLeft': {
      return 'RL'
    }
    default:
      nonexhaustive(direction)
  }
}

export function toAstViewLayoutDirection(c4: c4.ViewRuleAutoLayout['autoLayout']): ast.ViewLayoutDirection {
  switch (c4) {
    case 'TB': {
      return 'TopBottom'
    }
    case 'BT': {
      return 'BottomTop'
    }
    case 'LR': {
      return 'LeftRight'
    }
    case 'RL': {
      return 'RightLeft'
    }
    default:
      nonexhaustive(c4)
  }
}

export function elementExpressionFromPredicate(predicate: ast.ElementPredicate): ast.ElementExpression {
  if (ast.isElementExpression(predicate)) {
    return predicate
  }
  if (ast.isElementPredicateWhere(predicate)) {
    return predicate.subject
  }
  if (ast.isElementPredicateWith(predicate)) {
    return elementExpressionFromPredicate(predicate.subject)
  }
  nonexhaustive(predicate)
}
