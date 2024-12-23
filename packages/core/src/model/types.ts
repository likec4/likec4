import type { IsStringLiteral, LiteralUnion, Simplify } from 'type-fest'
import type {
  ComputedView,
  DiagramView,
  EdgeId,
  Fqn,
  GenericLikeC4Model,
  IteratorLike,
  KeysOf,
  LayoutedLikeC4Model,
  LikeC4ModelDump,
  NodeId,
  ParsedLikeC4Model,
  RelationId,
  ViewId,
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

type WithId<Id> = { id: Id }

type WithViews<Id extends string, ViewType> = { views: Record<Id, ViewType> }

/**
 * Auxilary type to keep track
 */
export interface Aux<
  Element extends string,
  Deployment extends string,
  View extends string,
  ViewType,
> {
  Element: Element
  Deployment: Deployment
  View: View

  // Wrapped Element
  // If Fqn is just a string, then we use generic Fqn to have better hints in the editor
  Fqn: IsStringLiteral<Element> extends true ? Fqn<Element> : Fqn
  ElementOrFqn: Element | WithId<this['Fqn']>

  // Wrapped Deployment
  DeploymentFqn: IsStringLiteral<Deployment> extends true ? Fqn<Deployment> : Fqn
  DeploymentOrFqn: Deployment | WithId<this['DeploymentFqn']>

  // Wrapped View
  ViewId: IsStringLiteral<View> extends true ? ViewId<View> : ViewId

  ViewType: ViewType

  RelationId: RelationId
  NodeId: NodeId
  NodeIdLiteral: string
  EdgeId: EdgeId
  EdgeIdLiteral: string

  NodeOrId: LiteralUnion<this['NodeIdLiteral'], string> | WithId<this['NodeId']>
  EdgeOrId: LiteralUnion<this['EdgeIdLiteral'], string> | WithId<this['EdgeId']>

  Model: Simplify<Omit<GenericLikeC4Model, 'views'> & WithViews<this['ViewId'], ViewType>>
}

export type AnyAux = Aux<
  string,
  string,
  string,
  any
>

export namespace Strict {
  export type Fqn<A extends AnyAux> = A['Element']
  export type Deployment<A extends AnyAux> = A['Deployment']
  export type ViewId<A extends AnyAux> = A['View']
}

export namespace Aux {
  export type FromParsed<M> = M extends ParsedLikeC4Model ? Aux<
      KeysOf<M['elements']>,
      KeysOf<M['deployments']['elements']>,
      KeysOf<M['views']>,
      ComputedView<ViewId<KeysOf<M['views']>>, string>
    >
    : never

  export type FromModel<M> = M extends GenericLikeC4Model ? Aux<
      KeysOf<M['elements']>,
      KeysOf<M['deployments']['elements']>,
      KeysOf<M['views']>,
      M extends LayoutedLikeC4Model ? DiagramView<ViewId<KeysOf<M['views']>>, string>
        : ComputedView<ViewId<KeysOf<M['views']>>, string>
    >
    : never

  export type FromDump<M> = M extends LikeC4ModelDump ? Aux<
      KeysOf<M['elements']>,
      KeysOf<M['deployments']['elements']>,
      KeysOf<M['views']>,
      DiagramView<ViewId<KeysOf<M['views']>>, string>
    >
    : never
}

// export type FromModel<M> = LikeC4Model<
//   M extends AnyLikeC4Model<
//     infer Fqn extends string,
//     infer Deployment extends string,
//     infer ViewId extends string,
//     any
//   > ? Aux<Fqn, Deployment, ViewId, M>
//     : Aux<KeysOf<>, string, string, ComputedLikeC4Model | LayoutedLikeC4Model>
// >
