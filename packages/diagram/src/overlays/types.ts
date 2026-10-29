import type { ElementDetailsActorRef, ElementDetailsInput } from './element-details/actor'
import type { RelationshipDetailsActorRef, RelationshipDetailsInput } from './relationship-details/actor'
import type { RelationshipsBrowserActorRef, RelationshipsBrowserInput } from './relationships-browser/actor'
export namespace Overlays {
  export namespace ElementDetails {
    export interface Input extends ElementDetailsInput {}
    export interface ActorRef extends ElementDetailsActorRef {}
  }

  export namespace RelationshipDetails {
    export type Input = RelationshipDetailsInput
    export interface ActorRef extends RelationshipDetailsActorRef {}
  }

  export namespace RelationshipsBrowser {
    export interface Input extends RelationshipsBrowserInput {}
    export interface ActorRef extends RelationshipsBrowserActorRef {}
  }
}
