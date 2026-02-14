import type { WritableAtom } from 'nanostores';
import type { RefObject } from 'react';
export declare const RootContainerContextProvider: import("react").Provider<{
    id: string;
    selector: string;
    ref: RefObject<HTMLDivElement | null>;
}>;
export declare function useRootContainerContext(): {
    id: string;
    selector: string;
    ref: RefObject<HTMLDivElement | null>;
};
export declare function useRootContainer(): {
    id: string;
    selector: string;
    ref: RefObject<HTMLDivElement | null>;
};
export declare function useRootContainerRef(): RefObject<HTMLDivElement>;
export declare function useRootContainerElement(): HTMLDivElement;
export declare const ReduceGraphicsModeProvider: import("react").Provider<boolean>;
/**
 * Hook to determine if reduced graphics mode is enabled.
 */
export declare function useIsReducedGraphics(): boolean;
export declare const PanningAtomSafeCtx: ({ children, value }: {
    value: WritableAtom<boolean>;
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element, usePanningAtom: () => WritableAtom<boolean>;
export declare function useIsPanning(): boolean;
