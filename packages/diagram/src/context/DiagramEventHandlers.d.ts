import { type PropsWithChildren, type RefObject } from 'react';
import type { LikeC4DiagramEventHandlers } from '../LikeC4Diagram.props';
type RequiredOrNull<T> = {
    [P in keyof T]-?: NonNullable<T[P]> | null;
};
type DiagramEventHandlersRef = RefObject<Required<LikeC4DiagramEventHandlers>>;
export type DiagramEventHandlersContext = RequiredOrNull<LikeC4DiagramEventHandlers> & {
    handlersRef: DiagramEventHandlersRef;
};
export declare function DiagramEventHandlers({ handlers, children, }: PropsWithChildren<{
    handlers: Required<LikeC4DiagramEventHandlers>;
}>): import("react").JSX.Element;
export declare function useDiagramEventHandlers(): DiagramEventHandlersContext;
export declare function useDiagramEventHandlersRef(): DiagramEventHandlersRef;
export {};
