import type { ElementDetailsActorRef } from './actor';
/**
 * To improve experience with HMR, we use `createSafeContext` as a boundary for hoooks
 */
export declare const ElementDetailsActorContext: import("react").Context<ElementDetailsActorRef>;
export declare const useElementDetailsActorRef: () => ElementDetailsActorRef;
