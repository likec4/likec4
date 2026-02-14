export declare function stopAndPrevent(e: React.KeyboardEvent | KeyboardEvent): void;
export declare function centerY(element: HTMLElement): number;
export declare function moveFocusToSearchInput(from: HTMLElement | null | undefined): void;
export declare function focusToFirstFoundElement(from: HTMLElement | null | undefined): void;
export declare function queryAllFocusable(from: HTMLElement | null | undefined, where: 'elements' | 'views', selector?: string): HTMLButtonElement[];
/**
 * Workaround: defers execution of the callback, to finish search panel close animation.
 * Otherwise, there could be weird artifacts when navigating to large diagrams.
 * @todo Find a better way to handle this, possibly with animationend event.
 */
export declare function whenSearchAnimationEnds(callback: () => void): void;
