import type { AdhocEditorActorRef, AdhocEditorSnapshot } from './state/actor';
export declare const AdhocEditorActorContextProvider: import("react").Provider<AdhocEditorActorRef>;
export declare function useAdhocEditorActor(): any;
export declare function useAdhocEditor(): {
    open: () => any;
    close: () => any;
    toggleRule: (ruleId: string) => any;
};
export declare function useAdhocEditorSnapshot<T = unknown>(selector: (state: AdhocEditorSnapshot) => T, compare?: (a: NoInfer<T>, b: NoInfer<T>) => boolean): NoInfer<T>;
export declare function useAdhocView(): any;
export declare function selectFromSnapshot<T = unknown>(selector: (state: AdhocEditorSnapshot) => T): (state: AdhocEditorSnapshot) => T;
export declare function selectFromContext<T = unknown>(selector: (state: AdhocEditorSnapshot['context']) => T): (state: AdhocEditorSnapshot) => T;
