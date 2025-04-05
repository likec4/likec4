import type { ExclusiveUnion, ProjectId } from './_common'
import type { PredicateSelector } from './deployments'
import type { BorderStyle, ElementKind, ElementShape } from './element'
import type { WhereOperator } from './operators'
import type { RelationshipArrowType, RelationshipLineType } from './relation'
import { type Fqn, type IconUrl, type Tag, GlobalFqn } from './scalars'
import type { Color, ShapeSize } from './theme'
import type { ViewId } from './view'

export namespace ModelLayer {
  export namespace FqnRef {
    /**
     * Reference to logical model element
     */
    export type ModelRef<F = Fqn> = {
      model: F
    }
    export const isModelRef = (ref: FqnRef): ref is ModelRef => {
      return 'model' in ref && !('project' in ref)
    }

    /**
     * Reference to imported logical model element
     */
    export type ImportRef<F = Fqn> = {
      project: ProjectId
      model: F
    }
    export const isImportRef = (ref: FqnRef): ref is ImportRef => {
      return 'project' in ref && 'model' in ref
    }

    export const toFqn = (ref: FqnRef): Fqn => {
      if (isImportRef(ref)) {
        return GlobalFqn(ref.project, ref.model)
      }
      if (isModelRef(ref)) {
        return ref.model
      }
      throw new Error('Expected FqnRef.ModelRef or FqnRef.ImportRef')
    }
  }

  export type FqnRef<M = Fqn> = ExclusiveUnion<{
    ModelRef: FqnRef.ModelRef<M>
    ImportRef: FqnRef.ImportRef<M>
  }>

  export namespace FqnExpr {
    export type Wildcard = {
      wildcard: true
    }
    export const isWildcard = (expr: Expression): expr is FqnExpr.Wildcard => {
      return 'wildcard' in expr && expr.wildcard === true
    }

    export type ModelRef<M = Fqn> = {
      ref: FqnRef.ModelRef<M> | FqnRef.ImportRef<M>
      selector?: PredicateSelector
    }
    export const isModelRef = (ref: Expression): ref is FqnExpr.ModelRef => {
      return 'ref' in ref
    }

    export type ElementKindExpr = {
      elementKind: ElementKind
      isEqual: boolean
    }
    export function isElementKindExpr(expr: Expression): expr is ElementKindExpr {
      return 'elementKind' in expr && 'isEqual' in expr
    }

    export type ElementTagExpr = {
      elementTag: Tag
      isEqual: boolean
    }
    export function isElementTagExpr(expr: Expression): expr is ElementTagExpr {
      return 'elementTag' in expr && 'isEqual' in expr
    }

    export type NonWildcard<M = Fqn> = ExclusiveUnion<{
      ModelRef: ModelRef<M>
      ElementKind: ElementKindExpr
      ElementTag: ElementTagExpr
    }>

    export type Where<M = Fqn> = {
      where: {
        expr: ExclusiveUnion<{
          Wildcard: Wildcard
          ModelRef: ModelRef<M>
          ElementKind: ElementKindExpr
          ElementTag: ElementTagExpr
        }>
        condition: WhereOperator<string, string>
      }
    }

    export const isWhere = (expr: Expression): expr is FqnExpr.Where => {
      return 'where' in expr && is(expr.where.expr)
    }

    export type Custom<M = Fqn> = {
      custom: {
        expr: FqnExprOrWhere<M>
        title?: string
        description?: string
        technology?: string
        notation?: string
        shape?: ElementShape
        color?: Color
        icon?: IconUrl
        border?: BorderStyle
        opacity?: number
        navigateTo?: ViewId
        multiple?: boolean
        size?: ShapeSize
        padding?: ShapeSize
        textSize?: ShapeSize
      }
    }

    export const isCustom = (expr: Expression): expr is FqnExpr.Custom => {
      return 'custom' in expr && (is(expr.custom.expr) || isWhere(expr.custom.expr))
    }

    export const is = (expr: Expression): expr is FqnExpr => {
      return isWildcard(expr)
        || isModelRef(expr)
        || isElementKindExpr(expr)
        || isElementTagExpr(expr)
    }
  }

  export type FqnExpr<M = Fqn> = ExclusiveUnion<{
    Wildcard: FqnExpr.Wildcard
    ModelRef: FqnExpr.ModelRef<M>
    ElementKind: FqnExpr.ElementKindExpr
    ElementTag: FqnExpr.ElementTagExpr
  }>

  export type FqnExprOrWhere<M = Fqn> = ExclusiveUnion<{
    Wildcard: FqnExpr.Wildcard
    ModelRef: FqnExpr.ModelRef<M>
    ElementKind: FqnExpr.ElementKindExpr
    ElementTag: FqnExpr.ElementTagExpr
    Where: FqnExpr.Where<M>
  }>

  export type AnyFqnExpr<M = Fqn> = ExclusiveUnion<{
    Wildcard: FqnExpr.Wildcard
    ModelRef: FqnExpr.ModelRef<M>
    ElementKind: FqnExpr.ElementKindExpr
    ElementTag: FqnExpr.ElementTagExpr
    Where: FqnExpr.Where<M>
    Custom: FqnExpr.Custom<M>
  }>

  export function isAnyFqnExpr(expr: Expression): expr is AnyFqnExpr {
    return FqnExpr.is(expr)
      || FqnExpr.isWhere(expr)
      || FqnExpr.isCustom(expr)
  }

  export namespace RelationExpr {
    export type Direct<M = Fqn> = {
      source: FqnExpr<M>
      target: FqnExpr<M>
      isBidirectional?: boolean
    }
    export const isDirect = (expr: Expression): expr is RelationExpr.Direct => {
      return 'source' in expr && 'target' in expr
    }
    export type Incoming<M = Fqn> = {
      incoming: FqnExpr<M>
    }
    export const isIncoming = (expr: Expression): expr is RelationExpr.Incoming => {
      return 'incoming' in expr
    }
    export type Outgoing<M = Fqn> = {
      outgoing: FqnExpr<M>
    }
    export const isOutgoing = (expr: Expression): expr is RelationExpr.Outgoing => {
      return 'outgoing' in expr
    }
    export type InOut<M = Fqn> = {
      inout: FqnExpr<M>
    }
    export const isInOut = (expr: Expression): expr is RelationExpr.InOut => {
      return 'inout' in expr
    }
    export type Where<M = Fqn> = {
      where: {
        expr: ExclusiveUnion<{
          Direct: RelationExpr.Direct<M>
          Incoming: RelationExpr.Incoming<M>
          Outgoing: RelationExpr.Outgoing<M>
          InOut: RelationExpr.InOut<M>
        }>
        condition: WhereOperator<string, string>
      }
    }
    export const isWhere = (expr: Expression): expr is RelationExpr.Where => {
      return 'where' in expr && is(expr.where.expr)
    }

    export type Custom<M = Fqn> = {
      customRelation: {
        expr: RelationExprOrWhere<M>
        title?: string
        description?: string
        technology?: string
        notation?: string
        // Link to dynamic view
        navigateTo?: ViewId
        // Notes for walkthrough
        notes?: string
        color?: Color
        line?: RelationshipLineType
        head?: RelationshipArrowType
        tail?: RelationshipArrowType
      }
    }

    export const isCustom = (expr: Expression): expr is Custom => {
      return 'customRelation' in expr
    }

    export const is = (expr: Expression): expr is RelationExpr => {
      return isDirect(expr)
        || isIncoming(expr)
        || isOutgoing(expr)
        || isInOut(expr)
    }
  }

  export type RelationExpr<M = Fqn> = ExclusiveUnion<{
    Direct: RelationExpr.Direct<M>
    Incoming: RelationExpr.Incoming<M>
    Outgoing: RelationExpr.Outgoing<M>
    InOut: RelationExpr.InOut<M>
  }>

  export type RelationExprOrWhere<M = Fqn> = ExclusiveUnion<{
    Direct: RelationExpr.Direct<M>
    Incoming: RelationExpr.Incoming<M>
    Outgoing: RelationExpr.Outgoing<M>
    InOut: RelationExpr.InOut<M>
    Where: RelationExpr.Where<M>
  }>

  export type AnyRelationExpr<M = Fqn> = ExclusiveUnion<{
    Direct: RelationExpr.Direct<M>
    Incoming: RelationExpr.Incoming<M>
    Outgoing: RelationExpr.Outgoing<M>
    InOut: RelationExpr.InOut<M>
    Where: RelationExpr.Where<M>
    CustomRelation: RelationExpr.Custom<M>
  }>

  export function isAnyRelationExpr(expr: Expression): expr is AnyRelationExpr {
    return RelationExpr.is(expr)
      || RelationExpr.isWhere(expr)
      || RelationExpr.isCustom(expr)
  }

  /**
   * Represents a version 2 expression which can be one of several types.
   *
   * @template M - The type for the model FQN, defaults to `Fqn`.
   */
  export type Expression<M = Fqn> = ExclusiveUnion<{
    Wildcard: FqnExpr.Wildcard
    ModelRef: FqnExpr.ModelRef<M>
    ElementKind: FqnExpr.ElementKindExpr
    ElementTag: FqnExpr.ElementTagExpr
    Custom: FqnExpr.Custom<M>
    Direct: RelationExpr.Direct<M>
    Incoming: RelationExpr.Incoming<M>
    Outgoing: RelationExpr.Outgoing<M>
    InOut: RelationExpr.InOut<M>
    CustomRelation: RelationExpr.Custom<M>
    Where: Expression.Where<M>
  }>

  export namespace Expression {
    export type Where<M = Fqn> = FqnExpr.Where<M> | RelationExpr.Where<M>

    export const isWhere = (expr: Expression): expr is Expression.Where => {
      return 'where' in expr
    }

    export const isCustomFqnExpr = (expr: Expression): expr is FqnExpr.Custom => {
      return FqnExpr.isCustom(expr)
    }

    export const isCustomRelationExpr = (expr: Expression): expr is RelationExpr.Custom => {
      return RelationExpr.isCustom(expr)
    }

    export const isFqnExpr = (expr: Expression): expr is FqnExpr => {
      return FqnExpr.is(expr)
    }

    export const isRelation = (expr: Expression): expr is RelationExpr => {
      return RelationExpr.is(expr)
    }
  }
}
