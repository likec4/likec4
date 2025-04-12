import type { ActorRefFrom } from 'xstate'
import type {
  ElementDetailsLogic,
  Events as ElementDetailsEvents,
  Input as ElementDetailsInput,
} from './element-details/actor'
import type {
  Events as RelationshipDetailsEvents,
  Input as RelationshipDetailsInput,
  RelationshipDetailsLogic,
} from './relationship-details/actor'
import type {
  Events as RelationshipsBrowserEvents,
  Input as RelationshipsBrowserInput,
  RelationshipsBrowserLogic,
} from './relationships-browser/actor'

export namespace Overlays {
  export namespace ElementDetails {
    export type Events = ElementDetailsEvents
    export type Input = ElementDetailsInput
    export type Logic = ElementDetailsLogic
    export interface ActorRef extends ActorRefFrom<ElementDetailsLogic> {}
  }

  export namespace RelationshipDetails {
    export type Events = RelationshipDetailsEvents
    export type Input = RelationshipDetailsInput
    export interface Logic extends RelationshipDetailsLogic {}
    export interface ActorRef extends ActorRefFrom<RelationshipDetailsLogic> {}
  }

  export namespace RelationshipsBrowser {
    export type Events = RelationshipsBrowserEvents
    export type Input = RelationshipsBrowserInput
    export interface Logic extends RelationshipsBrowserLogic {}
    export interface ActorRef extends ActorRefFrom<RelationshipsBrowserLogic> {}
  }
}
