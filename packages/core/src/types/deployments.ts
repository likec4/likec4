import { isString } from 'remeda'
import type { Merge, MergeExclusive, Simplify, Tagged, UnionToIntersection } from 'type-fest'
import type { Fqn, Tag } from './element'

export type DeploymentNodeKind<Kinds extends string = string> = Tagged<Kinds, 'DeploymentNodeKind'>

export interface DeploymentNode {
  // Full-qualified-name for Deployment model
  readonly id: Fqn
  readonly kind: DeploymentNodeKind
  readonly title?: string
}

export interface DeployedInstance {
  /**
   * Format: `<DeploymentNode Fqn>.<Instance Id>`
   * i.e parent fqn is deployment target
   */
  readonly id: Fqn
  readonly element: Fqn
}

export type PhysicalElement = DeploymentNode | DeployedInstance

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
      [Key in keyof Expressions[Name]]?: never
    }
  }[keyof Expressions]
>

// type PickExpression<Name extends keyof Expressions> = Simplify<AllNever<Name> & Expressions[Name]>

// export type DeploymentExpression = {
//   [Name in keyof Expressions]: PickExpression<Name>
// }[keyof Expressions]

// export namespace DeploymentExpression {
//   export type DeploymentRef = PickExpression<'DeploymentRef'>
//   export type Wildcard = PickExpression<'Wildcard'>
// }

type ExclusiveUnion<Expressions> = {
  [Name in keyof Expressions]: Simplify<Omit<AllNever<Expressions>, keyof Expressions[Name]> & Expressions[Name]>
}[keyof Expressions]

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

  export type Wildcard = {
    wildcard: true
  }
}

export type DeploymentExpression = ExclusiveUnion<{
  DeploymentRef: DeploymentExpression.Ref
  Wildcard: DeploymentExpression.Wildcard
}>
