// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type * as c4 from '@likec4/core'
import { MultiMap, nonexhaustive } from '@likec4/core/utils'
import type { AstNode, AstNodeDescription, DiagnosticInfo, LangiumDocument } from 'langium'
import { AstUtils, DocumentState } from 'langium'
import { clamp, isNullish, isTruthy } from 'remeda'
import type { ConditionalPick, MergeExclusive, Simplify, ValueOf, Writable } from 'type-fest'
import type { Diagnostic } from 'vscode-languageserver-types'
import type { LikeC4Grammar } from './generated/ast'
import * as ast from './generated/ast'
import { LikeC4LanguageMetaData } from './generated/module'
import type { IsValidFn } from './validation'

export { ast }

declare module 'langium' {
  export interface LangiumDocument {
    likec4ProjectId?: c4.ProjectId
  }

  export interface AstNodeDescription {
    likec4ProjectId?: c4.ProjectId
  }
}

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

export type ParsedElementStyle = {
  shape?: c4.ElementShape
  icon?: c4.IconUrl
  iconColor?: c4.Color
  iconSize?: c4.ShapeSize
  iconPosition?: c4.IconPosition
  color?: c4.Color
  border?: c4.BorderStyle
  opacity?: number
  multiple?: boolean
  size?: c4.ShapeSize
  padding?: c4.SpacingSize
  textSize?: c4.TextSize
}

export interface ParsedAstSpecification {
  tags: Record<c4.Tag, {
    astPath: string
    color?: c4.ColorLiteral
  }>
  elements: Record<c4.ElementKind, c4.ElementSpecification>
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
      color: c4.ColorLiteral
    }
  >
  deployments: Record<c4.DeploymentKind, c4.ElementSpecification>
}

export interface ParsedAstElement {
  id: c4.Fqn
  astPath: string
  kind: c4.ElementKind
  title: string
  summary?: c4.MarkdownOrString
  description?: c4.MarkdownOrString
  technology?: string
  tags?: c4.NonEmptyArray<c4.Tag>
  links?: c4.NonEmptyArray<c4.Link>
  style: ParsedElementStyle
  metadata?: { [key: string]: string | string[] }
}

export interface ParsedAstExtend {
  id: c4.Fqn
  astPath: string
  tags?: c4.NonEmptyArray<c4.Tag> | null
  links?: c4.NonEmptyArray<c4.Link> | null
  metadata?: { [key: string]: string | string[] }
}

export interface ParsedAstExtendRelation {
  id: c4.RelationId
  astPath: string
  tags?: c4.NonEmptyArray<c4.Tag> | null
  links?: c4.NonEmptyArray<c4.Link> | null
  metadata?: { [key: string]: string | string[] }
}

export interface ParsedAstRelation {
  id: c4.RelationId
  astPath: string
  source: c4.FqnRef.ModelRef
  target: c4.FqnRef.ModelRef
  kind?: c4.RelationshipKind
  tags?: c4.NonEmptyArray<c4.Tag>
  title: string
  description?: c4.MarkdownOrString
  technology?: string
  color?: c4.Color
  line?: c4.RelationshipLineType
  head?: c4.RelationshipArrowType
  tail?: c4.RelationshipArrowType
  links?: c4.NonEmptyArray<c4.Link>
  navigateTo?: c4.ViewId
  metadata?: { [key: string]: string | string[] }
}

// Alias for easier refactoring
export type ParsedAstDeployment = Simplify<MergeExclusive<ParsedAstDeployment.Node, ParsedAstDeployment.Instance>>
export namespace ParsedAstDeployment {
  export type Node = c4.DeploymentNode
  export type Instance = Omit<c4.DeployedInstance, 'element'> & {
    readonly element: c4.FqnRef.ModelRef
  }
}
export type ParsedAstDeploymentRelation = c4.DeploymentRelationship & {
  astPath: string
}

// Alias for refactoring
export type ParsedAstGlobals = Writable<c4.ModelGlobals>

export interface ParsedAstElementView {
  [c4._type]: 'element'
  id: c4.ViewId
  viewOf?: c4.Fqn
  extends?: c4.ViewId
  astPath: string
  title: string | null
  description: c4.MarkdownOrString | null
  tags: c4.NonEmptyArray<c4.Tag> | null
  links: c4.NonEmptyArray<c4.Link> | null
  rules: c4.ElementViewRule[]
  manualLayout?: c4.ViewManualLayout
}

export interface ParsedAstDynamicView {
  [c4._type]: 'dynamic'
  id: c4.ViewId
  astPath: string
  title: string | null
  description: c4.MarkdownOrString | null
  tags: c4.NonEmptyArray<c4.Tag> | null
  links: c4.NonEmptyArray<c4.Link> | null
  steps: c4.DynamicViewStep[]
  rules: Array<c4.DynamicViewRule>
  variant: c4.DynamicViewDisplayVariant | undefined
  manualLayout?: c4.ViewManualLayout
}

export interface ParsedAstDeploymentView {
  [c4._type]: 'deployment'
  id: c4.ViewId
  astPath: string
  title: string | null
  description: c4.MarkdownOrString | null
  tags: c4.NonEmptyArray<c4.Tag> | null
  links: c4.NonEmptyArray<c4.Link> | null
  rules: Array<c4.DeploymentViewRule>
  manualLayout?: c4.ViewManualLayout
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
  likec4ProjectId: c4.ProjectId
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
  c4ExtendRelations?: ParsedAstExtendRelation[]
  c4Relations?: ParsedAstRelation[]
  c4Globals?: ParsedAstGlobals
  c4Views?: ParsedAstView[]
  c4Deployments?: ParsedAstDeployment[]
  c4DeploymentRelations?: ParsedAstDeploymentRelation[]
  c4Imports?: MultiMap<c4.ProjectId, c4.Fqn, Set<c4.Fqn>>
}

type LikeC4GrammarDocument = Omit<LangiumDocument<LikeC4Grammar>, 'diagnostics'>

export interface LikeC4LangiumDocument extends LikeC4GrammarDocument, LikeC4DocumentProps {
  likec4ProjectId: c4.ProjectId
}
export interface ParsedLikeC4LangiumDocument extends LikeC4GrammarDocument, Required<LikeC4DocumentProps> {
  likec4ProjectId: c4.ProjectId
}

export function isLikeC4LangiumDocument(doc: LangiumDocument | undefined): doc is LikeC4LangiumDocument {
  return doc?.textDocument.languageId === LikeC4LanguageMetaData.languageId
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
    && !!doc.c4ExtendRelations
    && !!doc.c4Relations
    && !!doc.c4Views
    && !!doc.c4Deployments
    && !!doc.c4DeploymentRelations
    && !!doc.c4Imports
  )
}

export function parseMarkdownAsString(node?: ast.MarkdownOrString): string | undefined {
  return node?.markdown || node?.text
}

export function parseAstPercent(value: string): number {
  const opacity = parseFloat(value)
  return isNaN(opacity) ? 100 : clamp(opacity, { min: 0, max: 100 })
}

export function parseAstOpacityProperty({ value }: ast.OpacityProperty): number {
  return parseAstPercent(value)
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

export function parseAstIconPositionValue({ value }: { value: ast.IconPositionValue }): c4.IconPosition {
  switch (value) {
    case 'left':
    case 'right':
    case 'top':
    case 'bottom':
      return value
    default:
      nonexhaustive(value)
  }
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

export function toColor(astNode: ast.ColorProperty | ast.IconColorProperty): c4.Color | undefined {
  return astNode?.themeColor ?? (astNode?.customColor?.$refText as (c4.CustomColor | undefined))
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

// export function elementExpressionFromPredicate(predicate: ast.ElementPredicate): ast.ElementExpression {
//   if (ast.isElementExpression(predicate)) {
//     return predicate
//   }
//   if (ast.isElementPredicateWhere(predicate)) {
//     return predicate.subject
//   }
//   if (ast.isElementPredicateWith(predicate)) {
//     return elementExpressionFromPredicate(predicate.subject)
//   }
//   nonexhaustive(predicate)
// }

export function getViewRulePredicateContainer<T extends AstNode>(el: T):
  | ast.ViewRulePredicate
  | ast.DeploymentViewRulePredicate
  | ast.DynamicViewIncludePredicate
  | undefined
{
  return AstUtils.getContainerOfType(
    el,
    (n): n is ast.ViewRulePredicate | ast.DeploymentViewRulePredicate | ast.DynamicViewIncludePredicate => {
      return ast.isViewRulePredicate(n) || ast.isDeploymentViewRulePredicate(n) || ast.isDynamicViewIncludePredicate(n)
    },
  )
}

const _isModel = (astNode: AstNode) => {
  return ast.isModel(astNode) ||
    ast.isElementBody(astNode) ||
    ast.isExtendElementBody(astNode) ||
    ast.isElementViewBody(astNode) ||
    ast.isDynamicViewBody(astNode) ||
    ast.isElementRef(astNode)
}

const _isDeployment = (astNode: AstNode) => {
  return ast.isModelDeployments(astNode) ||
    ast.isDeploymentViewBody(astNode) ||
    ast.isDeploymentNodeBody(astNode) ||
    ast.isExtendDeploymentBody(astNode) ||
    ast.isDeployedInstanceBody(astNode)
}

export function isFqnRefInsideGlobals(astNode: AstNode): boolean {
  while (true) {
    if (_isDeployment(astNode) || _isModel(astNode)) {
      return false
    }
    if (ast.isGlobals(astNode) || ast.isModelViews(astNode)) {
      return true
    }
    if (astNode.$container) {
      astNode = astNode.$container
    } else {
      return false
    }
  }
}

export function isFqnRefInsideModel(astNode: AstNode): boolean {
  while (true) {
    if (_isDeployment(astNode)) {
      return false
    }
    if (_isModel(astNode)) {
      return true
    }
    if (astNode.$container) {
      astNode = astNode.$container
    } else {
      return false
    }
  }
}

export function isFqnRefInsideDeployment(astNode: AstNode): boolean {
  while (true) {
    if (_isModel(astNode)) {
      return false
    }
    if (_isDeployment(astNode)) {
      return true
    }
    if (astNode.$container) {
      astNode = astNode.$container
    } else {
      return false
    }
  }
}
