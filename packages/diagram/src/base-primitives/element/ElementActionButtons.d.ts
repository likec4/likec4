import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
type ElementActionButtonsProps = {
    selected?: boolean;
    data: {
        hovered?: boolean;
    };
    buttons: ElementActionButtons.Item[];
};
/**
 * Center-Bottom bar with action buttons. Intended to be used inside "leaf" nodes.
 *
 * @param selected - Whether the node is selected
 * @param data - Node data
 * @param buttons - Action buttons
 *
 * @example
 * ```tsx
 * <ElementActionButtons
 *   {...nodeProps}
 *   Buttons={[
 *     {
 *       key: 'action1',
 *       icon: <IconZoomScan />,
 *       onClick: (e) => {
 *         e.stopPropagation()
 *         console.log('action1 clicked')
 *       },
 *     },
 *     //...
 *   ]}
 * />
 * ```
 */
export declare function ElementActionButtons({ selected, data: { hovered: isHovered, }, buttons, }: ElementActionButtonsProps): import("react").JSX.Element;
export declare namespace ElementActionButtons {
    type Item = {
        key?: string;
        icon?: ReactNode;
        onClick: (e: ReactMouseEvent) => void;
    };
}
export {};
