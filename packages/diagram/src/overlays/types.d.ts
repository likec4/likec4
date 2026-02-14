import type { ElementDetailsActorRef, ElementDetailsInput, ElementDetailsLogic } from './element-details/actor';
import type { RelationshipDetailsActorRef, RelationshipDetailsInput, RelationshipDetailsLogic } from './relationship-details/actor';
import type { RelationshipsBrowserActorRef, RelationshipsBrowserInput, RelationshipsBrowserLogic } from './relationships-browser/actor';
export declare namespace Overlays {
    namespace ElementDetails {
        interface Input extends ElementDetailsInput {
        }
        interface Logic extends ElementDetailsLogic {
        }
        interface ActorRef extends ElementDetailsActorRef {
        }
    }
    namespace RelationshipDetails {
        type Input = RelationshipDetailsInput;
        interface Logic extends RelationshipDetailsLogic {
        }
        interface ActorRef extends RelationshipDetailsActorRef {
        }
    }
    namespace RelationshipsBrowser {
        interface Input extends RelationshipsBrowserInput {
        }
        interface Logic extends RelationshipsBrowserLogic {
        }
        interface ActorRef extends RelationshipsBrowserActorRef {
        }
    }
}
