import { type InternalNode, type ReactFlowInstance, type ReactFlowState } from '@xyflow/react';
import type { Types } from '../likec4diagram/types';
export type XYFlowInstance = ReactFlowInstance<Types.AnyNode, Types.AnyEdge>;
export declare function useXYFlow(): XYFlowInstance;
export type XYStoreState = ReactFlowState<Types.AnyNode, Types.AnyEdge>;
export declare function useXYStore<StateSlice = unknown>(selector: (state: XYStoreState) => StateSlice, equalityFn?: (a: NoInfer<StateSlice>, b: NoInfer<StateSlice>) => boolean): StateSlice;
export declare function useXYStoreApi(): XYStoreApi;
export type XYStoreApi = {
    getState: () => XYStoreState;
    setState: (state: Partial<XYStoreState> | ((state: XYStoreState) => Partial<XYStoreState>)) => void;
    subscribe: (listener: (state: XYStoreState, prevState: XYStoreState) => void) => () => void;
};
export type XYInternalNode = InternalNode<Types.AnyNode>;
export declare function useXYInternalNode(id: string): XYInternalNode | undefined;
/**
 * Returns the current zoom level of the flow.
 * @param precision The number of decimal places to round to, defaults to 2 (i.e. 1.23)
 * @returns The current zoom level of the flow.
 */
export declare function useCurrentZoom(precision?: number): number;
export declare function useCurrentZoomAtLeast(minZoom: number): boolean;
export declare function useIsZoomTooSmall(): boolean;
