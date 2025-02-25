import type { MergeExclusive, Simplify, Tagged } from 'type-fest'
import type { IconUrl, NonEmptyArray } from './_common'
import type { ElementShape, ElementStyle, Fqn, Link, Tag } from './element'
import type { AbstractRelation, RelationId } from './relation'
import type { Color } from './theme'

export type DeploymentNodeKind<Kinds extends string = string> = Tagged<Kinds, 'DeploymentNodeKind'>

export type DeploymentElementStyle = ElementStyle & {
  readonly icon?: IconUrl
  readonly shape?: ElementShape
  readonly color?: Color
}

export interface DeploymentNodeKindSpecification {
  readonly technology?: string
  readonly notation?: string
  readonly style: DeploymentElementStyle
}

export interface DeploymentNode {
  // Full-qualified-name for Deployment model
  readonly id: Fqn
  readonly kind: DeploymentNodeKind
  readonly title: string
  readonly description?: string | null
  readonly technology?: string | null
  readonly tags?: NonEmptyArray<Tag> | null
  readonly links?: NonEmptyArray<Link> | null
  readonly style?: DeploymentElementStyle
  readonly notation?: string
  readonly metadata?: Record<string, string>
}

export interface DeployedInstance {
  /**
   * Format: `<DeploymentNode Fqn>.<Instance Id>`
   * i.e parent fqn is deployment target
   */
  readonly id: Fqn
  readonly element: Fqn
  readonly title?: string
  readonly description?: string | null
  readonly technology?: string | null
  readonly tags?: NonEmptyArray<Tag> | null
  readonly links?: NonEmptyArray<Link> | null
  readonly style?: DeploymentElementStyle
  readonly notation?: string
  readonly metadata?: Record<string, string>
}

export type DeploymentElement = Simplify<MergeExclusive<DeploymentNode, DeployedInstance>>

export namespace DeploymentElement {
  export const isDeploymentNode = (el: DeploymentElement): el is DeploymentNode => {
    return 'kind' in el && !('element' in el)
  }
  export const isInstance = (el: DeploymentElement): el is DeployedInstance => {
    return 'element' in el && !('kind' in el)
  }
}

export type PredicateSelector =
  | 'children' // ele.*
  | 'expanded' // ele._
  | 'descendants' // ele.**

export interface DeploymentRef {
  // Reference to DeploymentNode or DeployedInstance
  readonly id: Fqn
  // Reference to element within DeployedInstance
  readonly element?: Fqn
}

/**
 * NOTE:
 */
export interface DeploymentRelation extends AbstractRelation {
  readonly id: RelationId
  readonly source: DeploymentRef
  readonly target: DeploymentRef
}

// export namespace DeploymentRelationExpression {
//   // type LogicalRefEndpoint = {
//   //   logicalRef: ElementRefExpr
//   // }
//   // export type DirectEndpoint = ExclusiveUnion<{
//   //   DeploymentElementExpression: DeploymentElementExpression
//   //   Logical: LogicalRefEndpoint
//   // }>

//   // export const isLogicalEndpoint = (expr: DirectEndpoint): expr is LogicalRefEndpoint => {
//   //   return 'logicalRef' in expr
//   // }

//   export type Direct = {
//     source: FqnExpression.Element
//     target: FqnExpression.Element
//     isBidirectional?: boolean
//   }
//   export const isDirect = (expr: DeploymentExpression): expr is Direct => {
//     return 'source' in expr && 'target' in expr
//   }
//   export type Incoming = {
//     incoming: FqnExpression.Element
//   }
//   export const isIncoming = (expr: DeploymentExpression): expr is Incoming => {
//     return 'incoming' in expr
//   }
//   export type Outgoing = {
//     outgoing: FqnExpression.Element
//   }
//   export const isOutgoing = (expr: DeploymentExpression): expr is Outgoing => {
//     return 'outgoing' in expr
//   }
//   export type InOut = {
//     inout: FqnExpression.Element
//   }
//   export const isInOut = (expr: DeploymentExpression): expr is InOut => {
//     return 'inout' in expr
//   }
// }

// export type DeploymentRelationExpression = ExclusiveUnion<{
//   Direct: DeploymentRelationExpression.Direct
//   Incoming: DeploymentRelationExpression.Incoming
//   Outgoing: DeploymentRelationExpression.Outgoing
//   InOut: DeploymentRelationExpression.InOut
// }>

// export namespace DeploymentElementExpression {
//   export type Ref = {
//     ref: DeploymentRef
//     selector?: PredicateSelector
//   }
//   export const isRef = (expr: DeploymentExpression): expr is Ref => {
//     return 'ref' in expr
//   }

//   export type Wildcard = {
//     wildcard: true
//   }
//   export const isWildcard = (expr: DeploymentExpression): expr is Wildcard => {
//     return 'wildcard' in expr && expr.wildcard === true
//   }
// }

// export type DeploymentElementExpression = ExclusiveUnion<{
//   DeploymentRef: DeploymentElementExpression.Ref
//   Wildcard: DeploymentElementExpression.Wildcard
// }>

// export type DeploymentExpression = ExclusiveUnion<{
//   Element: DeploymentElementExpression
//   Relation: DeploymentRelationExpression
// }>

// export namespace DeploymentExpression {
//   export type Element = DeploymentElementExpression
//   export type Relation = DeploymentRelationExpression

//   export const isElement = (expr: DeploymentExpression): expr is DeploymentElementExpression => {
//     return DeploymentElementExpression.isRef(expr) || DeploymentElementExpression.isWildcard(expr)
//   }
//   export const isRelation = (expr: DeploymentExpression): expr is DeploymentRelationExpression => {
//     return !DeploymentExpression.isElement(expr)
//   }
// }
