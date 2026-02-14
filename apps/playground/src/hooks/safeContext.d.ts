import type { PlaygroundActorRef } from '$state/types';
/**
 * To improve experience with HMR, we use `createSafeContext` as a boundary for hoooks
 */
export declare const PlaygroundActorSafeContext: import("react").Context<ActorRefFromLogic<any>>;
export declare const _useOptionalPlaygroundActorRef: () => PlaygroundActorRef | null;
export declare const _usePlaygroundActorRef: () => ActorRefFromLogic<any>;
