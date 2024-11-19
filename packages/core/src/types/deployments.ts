import type { Merge, MergeExclusive, Simplify, Tagged, UnionToIntersection, Writable } from 'type-fest'
import type { Fqn, Tag } from './element'

export type DeploymentNodeKind<Kinds extends string = string> = Tagged<Kinds, 'DeploymentNodeKind'>

export interface DeploymentNode {
  // Full-qualified-name for Deployment model
  readonly id: Fqn
  readonly kind: DeploymentNodeKind
  readonly title: string
}

export interface DeployedInstance {
  /**
   * Format: `<DeploymentNode Fqn>.<Instance Id>`
   * i.e parent fqn is deployment target
   */
  readonly id: Fqn
  readonly element: Fqn
}

export type PhysicalElement = Simplify<MergeExclusive<DeploymentNode, DeployedInstance>>

export namespace PhysicalElement {
  export const isDeploymentNode = (el: PhysicalElement): el is DeploymentNode => {
    return 'kind' in el && !('element' in el)
  }
}

export namespace DeploymentRef {
  export interface Node {
    readonly node: Fqn
  }
  export interface Instance {
    readonly instance: Fqn
    readonly element?: Fqn
  }
}
export type DeploymentRef = ExclusiveUnion<{
  Node: DeploymentRef.Node
  Instance: DeploymentRef.Instance
}>

export type PhysicalRelationId = Tagged<string, 'PhysicalRelationId'>

/**
 * NOTE:
 */
export interface PhysicalRelation {
  readonly id: PhysicalRelationId
  readonly source: DeploymentRef
  readonly target: DeploymentRef
}
// export interface DeploymentRelation

// interface Expressions {
//   DeploymentRef: {
//     ref: DeploymentRef
//     isExpanded?: boolean
//     isNested?: never
//   } | {
//     ref: DeploymentRef
//     isExpanded?: never
//     isNested?: boolean
//   }

//   Wildcard: {
//     wildcard: true
//   }
// }

type AllNever<Expressions> = UnionToIntersection<
  {
    [Name in keyof Expressions]: {
      -readonly [Key in keyof Expressions[Name]]?: never
    }
  }[keyof Expressions]
>

type ExclusiveUnion<Expressions> = Expressions extends object ? {
    [Name in keyof Expressions]: Simplify<Omit<AllNever<Expressions>, keyof Expressions[Name]> & Expressions[Name]>
  }[keyof Expressions]
  : Expressions

export namespace DeploymentExpression {
  export type Ref = {
    ref: DeploymentRef
    isExpanded?: boolean
    isNested?: never
  } | {
    ref: DeploymentRef
    isExpanded?: never
    isNested?: boolean
  }
  export const isRef = (expr: DeploymentExpression): expr is Ref => {
    return 'ref' in expr
  }

  export type Wildcard = {
    wildcard: true
  }
  export const isWildcard = (expr: DeploymentExpression): expr is Wildcard => {
    return 'wildcard' in expr && expr.wildcard === true
  }
}

export type DeploymentExpression = ExclusiveUnion<{
  DeploymentRef: DeploymentExpression.Ref
  Wildcard: DeploymentExpression.Wildcard
}>
