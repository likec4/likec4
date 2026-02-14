import { createContext, use } from 'react';
/**
 * To improve experience with HMR, we use `createSafeContext` as a boundary for hoooks
 */
export const PlaygroundActorSafeContext = createContext(null);
PlaygroundActorSafeContext.displayName = 'PlaygroundActorSafeContext';
export const _useOptionalPlaygroundActorRef = () => {
    return use(PlaygroundActorSafeContext);
};
export const _usePlaygroundActorRef = () => {
    const ctx = use(PlaygroundActorSafeContext);
    if (ctx === null) {
        throw new Error('PlaygroundActorRef is not provided');
    }
    return ctx;
};
