import { type DependencyList } from 'react';
import type { DiagramApi } from '../likec4diagram/state/diagram-api';
import type { DiagramActorSnapshot, DiagramContext, DiagramEmittedEvents } from '../likec4diagram/state/types';
import { useDiagram, useDiagramActorRef } from './safeContext';
export { useDiagram, useDiagramActorRef };
export type { DiagramApi, DiagramContext };
/**
 * Helper to create a selector for diagram actor snapshot
 */
export declare function selectDiagramActor<T = unknown>(selector: (state: DiagramActorSnapshot) => T): (state: DiagramActorSnapshot) => T;
export declare function useDiagramSnapshot<T = unknown>(selector: (state: DiagramActorSnapshot) => T, compare?: (a: NoInfer<T>, b: NoInfer<T>) => boolean): T;
/**
 * Helper to create a selector for diagram actor snapshot
 */
export declare function selectDiagramActorContext<T = unknown>(selector: (state: DiagramContext) => T): (state: DiagramActorSnapshot) => T;
/**
 * Read diagram context
 */
export declare function useDiagramContext<T = unknown>(selector: (context: DiagramContext) => T, compare?: (a: NoInfer<T>, b: NoInfer<T>) => boolean, deps?: DependencyList): T;
type PickEmittedEvent<T> = T extends DiagramEmittedEvents['type'] ? DiagramEmittedEvents & {
    type: T;
} : unknown;
/**
 * Subscribe to diagram emitted events
 * @example
 * ```tsx
 * useOnDiagramEvent('navigateTo', ({viewId}) => {
 *   console.log('Navigating to view', viewId)
 * })
 * ```
 */
export declare function useOnDiagramEvent<T extends DiagramEmittedEvents['type'] | '*'>(event: T, callback: (event: PickEmittedEvent<T>) => void, options?: {
    once?: boolean;
}): void;
