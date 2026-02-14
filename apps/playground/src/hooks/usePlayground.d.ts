import type { PlaygroundActorRef, PlaygroundActorSnapshot, PlaygroundContext } from '$state/types';
import { type ViewChange, type ViewId } from '@likec4/core';
import type { Locate as LocateRequest } from '@likec4/language-server/protocol';
import { type DependencyList } from 'react';
import { _useOptionalPlaygroundActorRef as useOptionalPlaygroundActorRef, _usePlaygroundActorRef as usePlaygroundActorRef } from './safeContext';
export { useOptionalPlaygroundActorRef, usePlaygroundActorRef };
export declare function usePlayground(): {
    readonly actor: PlaygroundActorRef;
    readonly workspaceId: any;
    readonly value: any;
    send: any;
    getSnapshot: () => PlaygroundActorSnapshot;
    getContext: () => PlaygroundContext;
    getActiveFile: () => {
        filename: any;
        text: any;
        isChanged: boolean;
    };
    changeActiveFile: (filename: string) => void;
    changeActiveView: (viewId: ViewId) => void;
    openSources: (target: LocateRequest.Params) => void;
    applyViewChanges: (change: ViewChange) => void;
};
export declare function usePlaygroundContext<T = unknown>(selector: (state: PlaygroundContext) => T, compare?: (a: NoInfer<T>, b: NoInfer<T>) => boolean, deps?: DependencyList): any;
export declare function usePlaygroundSnapshot<T = unknown>(selector: (state: PlaygroundActorSnapshot) => T, compare?: (a: NoInfer<T>, b: NoInfer<T>) => boolean, deps?: DependencyList): any;
export declare function usePlaygroundWorkspace(): any;
export declare function usePlaygroundActiveFile(): any;
export declare function usePlaygroundLikeC4Model(): any;
