import type { IsLiteral, LiteralUnion, Simplify } from 'type-fest'
import type {
  AnyLikeC4Model,
  ComputedView,
  DiagramView,
  EdgeId,
  Fqn,
  LayoutedLikeC4Model,
  NodeId,
  ParsedLikeC4ModelDump,
  RelationId,
  ViewId
} from '../types'
import { isString } from '../utils/guards'

export type IncomingFilter = 'all' | 'direct' | 'to-descendants'
export type OutgoingFilter = 'all' | 'direct' | 'from-descendants'

/**
 * Utility function to extract `id` from the given element.
 */
export function getId<Id extends string>(element: string | { id: Id }): Id {
  return isString(element) ? element as Id : element.id
}

export type IteratorLike<T> = IteratorObject<T, BuiltinIteratorReturn>

type WithId<Id> = { id: Id }

type WithViews<Id extends string, ViewType> = { views: Record<Id, ViewType> }

/**
 * Auxilary type to keep track
 */
export interface Aux<
  Element extends string,
  Deployment extends string,
  Views extends string,
  ViewType
> {
  // Model: Model

  // If Fqn is just a string, then we use generic Fqn to have better hints in the editor
  Fqn: IsLiteral<Element> extends true ? Fqn<Element> : Fqn
  Element: Element
  ElementOrFqn: Element | WithId<this['Fqn']>

  DeploymentFqn: IsLiteral<Deployment> extends true ? Fqn<Deployment> : Fqn
  Deployment: Deployment
  DeploymentOrFqn: Deployment | WithId<this['DeploymentFqn']>

  ViewId: IsLiteral<Views> extends true ? ViewId<Views> : ViewId
  ViewIdLiteral: Views
  ViewType: ViewType

  RelationId: RelationId
  NodeId: NodeId
  NodeIdLiteral: string
  EdgeId: EdgeId
  EdgeIdLiteral: string

  NodeOrId: LiteralUnion<this['NodeIdLiteral'], string> | WithId<this['NodeId']>
  EdgeOrId: LiteralUnion<this['EdgeIdLiteral'], string> | WithId<this['EdgeId']>

  Model: Simplify<Omit<AnyLikeC4Model, 'views'> & WithViews<this['ViewId'], ViewType>>
}

export type AnyAux = Aux<
  string,
  string,
  string,
  any
>

export namespace Aux {
  export type FromModel<M> = M extends AnyLikeC4Model ? Aux<
      KeysOf<M['elements']>,
      KeysOf<M['deployments']['elements']>,
      KeysOf<M['views']>,
      M extends LayoutedLikeC4Model ? DiagramView : ComputedView
    >
    : never

  export type FromDump<M> = M extends ParsedLikeC4ModelDump ? Aux<
      KeysOf<M['elements']>,
      KeysOf<M['deployments']['elements']>,
      KeysOf<M['views']>,
      DiagramView
    >
    : never
}

export type KeysOf<T> = keyof T extends infer K extends string ? K : never

// export type FromModel<M> = LikeC4Model<
//   M extends AnyLikeC4Model<
//     infer Fqn extends string,
//     infer Deployment extends string,
//     infer ViewId extends string,
//     any
//   > ? Aux<Fqn, Deployment, ViewId, M>
//     : Aux<KeysOf<>, string, string, ComputedLikeC4Model | LayoutedLikeC4Model>
// >
