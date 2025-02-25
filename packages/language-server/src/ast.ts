import type * as c4 from '@likec4/core'
import { DefaultArrowType, DefaultLineStyle, DefaultRelationshipColor, nonexhaustive } from '@likec4/core'
import type { AstNode, AstNodeDescription, DiagnosticInfo, LangiumDocument } from 'langium'
import { DocumentState } from 'langium'
import { clamp, isBoolean, isNullish, isTruthy } from 'remeda'
import type { ConditionalPick, ValueOf, Writable } from 'type-fest'
import type { Diagnostic } from 'vscode-languageserver-types'
import type { LikeC4Grammar } from './generated/ast'
import * as ast from './generated/ast'
import { LikeC4LanguageMetaData } from './generated/module'
import type { IsValidFn } from './validation'

export { ast }

const idattr = Symbol.for('idattr')

declare module './generated/ast' {
  export interface Element {
    [idattr]?: c4.Fqn | undefined
  }
  export interface ElementView {
    [idattr]?: c4.ViewId | undefined
  }
  export interface DynamicView {
    [idattr]?: c4.ViewId | undefined
  }
  export interface DeploymentView {
    [idattr]?: c4.ViewId | undefined
  }
  export interface DeploymentNode {
    [idattr]?: c4.Fqn | undefined
  }
  export interface DeployedInstance {
    [idattr]?: c4.Fqn | undefined
  }
}

type ParsedElementStyle = {
  shape?: c4.ElementShape
  icon?: c4.IconUrl
  color?: c4.Color
  border?: c4.BorderStyle
  opacity?: number
  multiple?: boolean
  size?: c4.ShapeSize
  padding?: c4.SpacingSize
  textSize?: c4.TextSize
}

export interface ParsedAstSpecification {
  tags: Set<c4.Tag>
  elements: Record<c4.ElementKind, {
    technology?: string
    notation?: string
    style: ParsedElementStyle
  }>
  relationships: Record<
    c4.RelationshipKind,
    {
      technology?: string
      notation?: string
      color?: c4.Color
      line?: c4.RelationshipLineType
      head?: c4.RelationshipArrowType
      tail?: c4.RelationshipArrowType
    }
  >
  colors: Record<
    c4.CustomColor,
    {
      color: c4.HexColorLiteral
    }
  >
  deployments: Record<c4.DeploymentNodeKind, c4.DeploymentNodeKindSpecification>
}

export interface ParsedAstElement {
  id: c4.Fqn
  astPath: string
  kind: c4.ElementKind
  title: string
  description?: string
  technology?: string
  tags?: c4.NonEmptyArray<c4.Tag>
  links?: c4.NonEmptyArray<c4.Link>
  style: ParsedElementStyle
  metadata?: { [key: string]: string }
}

export interface ParsedAstExtend {
  id: c4.Fqn
  astPath: string
  tags?: c4.NonEmptyArray<c4.Tag>
  links?: c4.NonEmptyArray<c4.Link>
  metadata?: { [key: string]: string }
}

export interface ParsedAstRelation {
  id: c4.RelationId
  astPath: string
  source: c4.Fqn
  target: c4.Fqn
  kind?: c4.RelationshipKind
  tags?: c4.NonEmptyArray<c4.Tag>
  title: string
  description?: string
  technology?: string
  color?: c4.Color
  line?: c4.RelationshipLineType
  head?: c4.RelationshipArrowType
  tail?: c4.RelationshipArrowType
  links?: c4.NonEmptyArray<c4.Link>
  navigateTo?: c4.ViewId
  metadata?: { [key: string]: string }
}

// Alias for easier refactoring
export type ParsedAstDeployment = c4.DeploymentElement
export namespace ParsedAstDeployment {
  export type Node = c4.DeploymentNode
  export type Instance = c4.DeployedInstance
}
export type ParsedAstDeploymentRelation = c4.DeploymentRelation & {
  astPath: string
}

// Alias for refactoring
export type ParsedAstGlobals = Writable<c4.ModelGlobals>

export interface ParsedAstElementView {
  __: 'element'
  id: c4.ViewId
  viewOf?: c4.Fqn
  extends?: c4.ViewId
  astPath: string
  title: string | null
  description: string | null
  tags: c4.NonEmptyArray<c4.Tag> | null
  links: c4.NonEmptyArray<c4.Link> | null
  rules: c4.ViewRule[]
  manualLayout?: c4.ViewManualLayout
}

export interface ParsedAstDynamicView {
  __: 'dynamic'
  id: c4.ViewId
  astPath: string
  title: string | null
  description: string | null
  tags: c4.NonEmptyArray<c4.Tag> | null
  links: c4.NonEmptyArray<c4.Link> | null
  steps: c4.DynamicViewStepOrParallel[]
  rules: Array<c4.DynamicViewRule>
  manualLayout?: c4.ViewManualLayout
}

export interface ParsedAstDeploymentView {
  __: 'deployment'
  id: c4.ViewId
  astPath: string
  title: string | null
  description: string | null
  tags: c4.NonEmptyArray<c4.Tag> | null
  links: c4.NonEmptyArray<c4.Link> | null
  rules: Array<c4.DeploymentViewRule>
}

export type ParsedAstView = ParsedAstElementView | ParsedAstDynamicView | ParsedAstDeploymentView
export const ViewOps = {
  writeId<T extends ast.LikeC4View>(node: T, id: c4.ViewId): T {
    node[idattr] = id
    return node
  },
  readId(node: ast.LikeC4View): c4.ViewId | undefined {
    return node[idattr]
  },
}

export const ElementOps = {
  writeId(node: ast.Element | ast.DeploymentElement, id: c4.Fqn | null) {
    if (isNullish(id)) {
      node[idattr] = undefined
    } else {
      node[idattr] = id
    }
    return node
  },
  readId(node: ast.Element | ast.DeploymentElement) {
    return node[idattr]
  },
}

export interface AstNodeDescriptionWithFqn extends AstNodeDescription {
  id: c4.Fqn
}

// export type LikeC4AstNode = ast.LikeC4AstType[keyof ast.LikeC4AstType]
export type LikeC4AstNode = ValueOf<ConditionalPick<ast.LikeC4AstType, AstNode>>
type LikeC4DocumentDiagnostic = Diagnostic & DiagnosticInfo<LikeC4AstNode>

export interface LikeC4DocumentProps {
  diagnostics?: Array<LikeC4DocumentDiagnostic>
  c4Specification?: ParsedAstSpecification
  c4Elements?: ParsedAstElement[]
  c4ExtendElements?: ParsedAstExtend[]
  c4ExtendDeployments?: ParsedAstExtend[]
  c4Relations?: ParsedAstRelation[]
  c4Globals?: ParsedAstGlobals
  c4Views?: ParsedAstView[]
  c4Deployments?: ParsedAstDeployment[]
  c4DeploymentRelations?: ParsedAstDeploymentRelation[]
}

type LikeC4GrammarDocument = Omit<LangiumDocument<LikeC4Grammar>, 'diagnostics'>

export interface LikeC4LangiumDocument extends LikeC4GrammarDocument, LikeC4DocumentProps {}
export interface ParsedLikeC4LangiumDocument extends LikeC4GrammarDocument, Required<LikeC4DocumentProps> {}

export function isLikeC4LangiumDocument(doc: LangiumDocument): doc is LikeC4LangiumDocument {
  return doc.textDocument.languageId === LikeC4LanguageMetaData.languageId
}

export function isParsedLikeC4LangiumDocument(
  doc: LangiumDocument,
): doc is ParsedLikeC4LangiumDocument {
  return (
    isLikeC4LangiumDocument(doc)
    && doc.state == DocumentState.Validated
    && !!doc.c4Specification
    && !!doc.c4Elements
    && !!doc.c4ExtendElements
    && !!doc.c4ExtendDeployments
    && !!doc.c4Relations
    && !!doc.c4Views
    && !!doc.c4Deployments
    && !!doc.c4DeploymentRelations
  )
}

export function parseAstOpacityProperty({ value }: ast.OpacityProperty): number {
  const opacity = parseFloat(value)
  return isNaN(opacity) ? 100 : clamp(opacity, { min: 0, max: 100 })
}

export function parseAstSizeValue({ value }: { value: ast.SizeValue }): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
  switch (value) {
    case 'xs':
    case 'sm':
    case 'md':
    case 'lg':
    case 'xl':
      return value
    case 'xsmall':
      return 'xs'
    case 'small':
      return 'sm'
    case 'medium':
      return 'md'
    case 'large':
      return 'lg'
    case 'xlarge':
      return 'xl'
    default:
      nonexhaustive(value)
  }
}

export function toElementStyle(props: Array<ast.StyleProperty> | undefined, isValid: IsValidFn) {
  const result = {} as ParsedElementStyle
  if (!props || props.length === 0) {
    return result
  }
  for (const prop of props) {
    if (!isValid(prop)) {
      continue
    }
    switch (true) {
      case ast.isBorderProperty(prop): {
        if (isTruthy(prop.value)) {
          result.border = prop.value
        }
        break
      }
      case ast.isColorProperty(prop): {
        const color = toColor(prop)
        if (isTruthy(color)) {
          result.color = color
        }
        break
      }
      case ast.isShapeProperty(prop): {
        if (isTruthy(prop.value)) {
          result.shape = prop.value
        }
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
      case ast.isMultipleProperty(prop): {
        result.multiple = isBoolean(prop.value) ? prop.value : false
        break
      }
      case ast.isShapeSizeProperty(prop): {
        if (isTruthy(prop.value)) {
          result.size = parseAstSizeValue(prop)
        }
        break
      }
      case ast.isPaddingSizeProperty(prop): {
        if (isTruthy(prop.value)) {
          result.padding = parseAstSizeValue(prop)
        }
        break
      }
      case ast.isTextSizeProperty(prop): {
        if (isTruthy(prop.value)) {
          result.textSize = parseAstSizeValue(prop)
        }
        break
      }
      default:
        nonexhaustive(prop)
    }
  }
  return result
}

export function toRelationshipStyle(props: ast.RelationshipStyleProperty[] | undefined, isValid: IsValidFn) {
  const result = {} as {
    color?: c4.Color
    line?: c4.RelationshipLineType
    head?: c4.RelationshipArrowType
    tail?: c4.RelationshipArrowType
  }
  if (!props || props.length === 0) {
    return result
  }
  for (const prop of props) {
    if (!isValid(prop)) {
      continue
    }
    switch (true) {
      case ast.isColorProperty(prop): {
        const color = toColor(prop)
        if (isTruthy(color)) {
          result.color = color
        }
        break
      }
      case ast.isLineProperty(prop): {
        result.line = prop.value
        break
      }
      case ast.isArrowProperty(prop): {
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
        break
      }
      default: {
        nonexhaustive(prop)
      }
    }
  }
  return result
}

export function toRelationshipStyleExcludeDefaults(
  props: ast.SpecificationRelationshipKind['props'] | undefined,
  isValid: IsValidFn,
) {
  const { color, line, head, tail } = toRelationshipStyle(props?.filter(ast.isRelationshipStyleProperty), isValid)
  return {
    ...(color && color !== DefaultRelationshipColor ? { color } : {}),
    ...(line && line !== DefaultLineStyle ? { line } : {}),
    ...(head && head !== DefaultArrowType ? { head } : {}),
    ...(tail ? { tail } : {}),
  }
}

export function toColor(astNode: ast.ColorProperty): c4.Color | undefined {
  return astNode?.themeColor ?? (astNode?.customColor?.$refText as (c4.HexColorLiteral | undefined))
}

export function toAutoLayout(
  rule: ast.ViewRuleAutoLayout,
): c4.ViewRuleAutoLayout {
  const rankSep = rule.rankSep
  const nodeSep = rule.nodeSep

  let direction: c4.ViewRuleAutoLayout['direction']
  switch (rule.direction) {
    case 'TopBottom': {
      direction = 'TB'
      break
    }
    case 'BottomTop': {
      direction = 'BT'
      break
    }
    case 'LeftRight': {
      direction = 'LR'
      break
    }
    case 'RightLeft': {
      direction = 'RL'
      break
    }
    default:
      nonexhaustive(rule.direction)
  }

  return {
    direction,
    ...(nodeSep && { nodeSep }),
    ...(rankSep && { rankSep }),
  }
}

export function toAstViewLayoutDirection(c4: c4.ViewRuleAutoLayout['direction']): ast.ViewLayoutDirection {
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
