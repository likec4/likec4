import type { Fqn } from '@likec4/core';
import { type StoreSnapshot } from '@xstate/store';
import type { TreeCollection } from '@zag-js/collection';
import { type PropsWithChildren } from 'react';
import { type TreeNodeData } from '../useElementsTree';
type EditorPanelState = {
    searchInput: string;
    expandedValue: string[];
    collection: TreeCollection<TreeNodeData>;
};
declare const createEditorPanelStore: ({ initial, sideEffects, }: {
    initial: TreeCollection<TreeNodeData>;
    sideEffects: {
        onElementStateClick: (payload: {
            id: Fqn;
        }) => void;
    };
}) => import("@xstate/store").Store<EditorPanelState, {
    inputChange: {
        value: string;
    };
    inputKeyDown: {};
    modelUpdate: {
        collection: TreeCollection<TreeNodeData>;
    };
    elementClick: {
        id: Fqn;
    };
}, {
    type: "inputKeyDown";
}>;
export type EditorPanelStore = ReturnType<typeof createEditorPanelStore>;
export declare const EditorPanelStoreProvider: (props: PropsWithChildren) => import("react").JSX.Element;
export declare function selectEditorPanelState<T>(selector: (state: EditorPanelState) => T): [
    selector: (snapshot: StoreSnapshot<EditorPanelState>) => T,
    compare: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean
];
export declare function selectEditorPanelState<T>(selector: (state: EditorPanelState) => T, compare: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean): [
    selector: (snapshot: StoreSnapshot<EditorPanelState>) => T,
    compare: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean
];
export declare function useEditorPanelStore(): import("@xstate/store").Store<EditorPanelState, {
    inputChange: {
        value: string;
    };
    inputKeyDown: {};
    modelUpdate: {
        collection: TreeCollection<TreeNodeData>;
    };
    elementClick: {
        id: Fqn;
    };
}, {
    type: "inputKeyDown";
}>;
export declare function useEditorPanelState<T>(arg1: readonly [
    (snapshot: StoreSnapshot<EditorPanelState>) => T,
    (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean
]): T;
export declare function useEditorPanelState<T>(selector: (snapshot: StoreSnapshot<EditorPanelState>) => T, compare?: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean): T;
/**
 * Hook to subscribe to editor panel events
 * @param args - The event name and handler function
 * @example
 * useOnEditorPanelEvent('inputKeyDown', () => {
 *   console.log('Input key down event')
 * })
 */
export declare function useOnEditorPanelEvent(...args: Parameters<EditorPanelStore['on']>): void;
/**
 * Hook to access the editor panel store trigger or create a wrapped trigger function
 *
 * @overload
 * @returns The store trigger object
 *
 * @overload
 * @template T - The parameter types for the wrapped trigger function
 * @param trigger - A function that receives the store trigger as the first parameter
 * @returns A wrapped function that calls the trigger with the store trigger prepended
 *
 * @example
 * // Get the trigger object directly
 * const trigger = useEditorPanelTrigger()
 * trigger.inputChange({ value: 'search' })
 *
 * @example
 * // Create a wrapped trigger function
 * const handleInputChange = useEditorPanelTrigger((trigger, value: string) => {
 *   trigger.inputChange({ value })
 * })
 * handleInputChange('search')
 */
export declare function useEditorPanelTrigger(): EditorPanelStore['trigger'];
export declare function useEditorPanelTrigger<T extends any[]>(trigger: (...params: [trigger: EditorPanelStore['trigger'], ...T]) => void): (...args: T) => void;
export {};
