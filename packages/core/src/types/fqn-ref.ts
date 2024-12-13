import type { ExclusiveUnion } from './_common'
import type { PredicateSelector } from './deployments'
import type { Fqn } from './element'

export namespace FqnRef {
  /**
   * Reference to descendant of deployed instance
   */
  export type InsideDeployedInstance = {
    deployment: Fqn
    element: Fqn
  }
  export const isInsideDeployedInstance = (ref: FqnRef): ref is InsideDeployedInstance => {
    return 'deployment' in ref && 'element' in ref
  }

  /**
   * Reference to deployment element
   */
  export type DeploymentElement = {
    deployment: Fqn
  }
  export const isDeploymentElement = (ref: FqnRef): ref is DeploymentElement => {
    return 'deployment' in ref && !('element' in ref)
  }

  export type Deployment = DeploymentElement | InsideDeployedInstance
  export const isDeployment = (ref: FqnRef): ref is Deployment => {
    return !isModelElement(ref)
  }

  /**
   * Reference to logical model element
   */
  export type Element = {
    model: Fqn
  }
  export const isModelElement = (ref: FqnRef): ref is Element => {
    return 'model' in ref
  }
}

export type FqnRef = ExclusiveUnion<{
  InsideDeployedInstance: FqnRef.InsideDeployedInstance
  DeploymentElement: FqnRef.DeploymentElement
  Element: FqnRef.Element
}>

export namespace FqnExpression {
  export namespace Element {
    export type Ref = {
      ref: FqnRef
      selector?: PredicateSelector
    }
    export const isRef = (expr: FqnExpression): expr is FqnExpression.Element.Ref => {
      return 'ref' in expr
    }

    export type ModelRef = {
      ref: FqnRef.Element
      selector?: PredicateSelector
    }
    export const isModelRef = (expr: FqnExpression): expr is ModelRef => {
      return 'ref' in expr && FqnRef.isModelElement(expr.ref)
    }

    export type DeploymentRef = {
      ref: FqnRef.Deployment
      selector?: PredicateSelector
    }
    export const isDeploymentRef = (expr: FqnExpression): expr is DeploymentRef => {
      return 'ref' in expr && FqnRef.isDeployment(expr.ref)
    }

    export type Wildcard = {
      wildcard: true
    }
    export const isWildcard = (expr: FqnExpression): expr is Wildcard => {
      return 'wildcard' in expr && expr.wildcard === true
    }
  }

  export type Element = ExclusiveUnion<{
    ModelRef: FqnExpression.Element.ModelRef
    DeploymentRef: FqnExpression.Element.DeploymentRef
    Wildcard: FqnExpression.Element.Wildcard
  }>

  export namespace Relation {
    export type Direct = {
      source: FqnExpression.Element
      target: FqnExpression.Element
      isBidirectional?: boolean
    }
    export const isDirect = (expr: FqnExpression): expr is Direct => {
      return 'source' in expr && 'target' in expr
    }
    export type Incoming = {
      incoming: FqnExpression.Element
    }
    export const isIncoming = (expr: FqnExpression): expr is Incoming => {
      return 'incoming' in expr
    }
    export type Outgoing = {
      outgoing: FqnExpression.Element
    }
    export const isOutgoing = (expr: FqnExpression): expr is Outgoing => {
      return 'outgoing' in expr
    }
    export type InOut = {
      inout: FqnExpression.Element
    }
    export const isInOut = (expr: FqnExpression): expr is InOut => {
      return 'inout' in expr
    }
  }

  export type Relation = ExclusiveUnion<{
    Direct: FqnExpression.Relation.Direct
    Incoming: FqnExpression.Relation.Incoming
    Outgoing: FqnExpression.Relation.Outgoing
    InOut: FqnExpression.Relation.InOut
  }>

  export const isElement = (expr: FqnExpression): expr is FqnExpression.Element => {
    return FqnExpression.Element.isRef(expr)
      || FqnExpression.Element.isWildcard(expr)
  }

  export const isRelation = (expr: FqnExpression): expr is FqnExpression.Relation => {
    return FqnExpression.Relation.isDirect(expr)
      || FqnExpression.Relation.isIncoming(expr)
      || FqnExpression.Relation.isOutgoing(expr)
      || FqnExpression.Relation.isInOut(expr)
  }
}

export type FqnExpression = ExclusiveUnion<{
  Ref: FqnExpression.Element.Ref
  Wildcard: FqnExpression.Element.Wildcard
  Direct: FqnExpression.Relation.Direct
  Incoming: FqnExpression.Relation.Incoming
  Outgoing: FqnExpression.Relation.Outgoing
  InOut: FqnExpression.Relation.InOut
}>
