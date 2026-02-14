import type { SimplifyDeep } from 'type-fest';
import { ElementActionButtons } from '../../../base-primitives';
import type { BaseNodeData } from '../../../base/types';
import type { Types } from '../../types';
type WithExtraButtons = {
    /**
     * Add extra action buttons
     * @example
     * ```tsx
     * <ElementActions
     *   extraButtons={[
     *     {
     *       key: 'extra',
     *       icon: <IconZoomScan />,
     *       onClick: (e) => {
     *         e.stopPropagation()
     *         console.log('extra action clicked')
     *       },
     *       },
     *     },
     *   ]}
     * />
     * ```
     */
    extraButtons?: ElementActionButtons.Item[];
};
export type ElementActionsProps = SimplifyDeep<{
    selected?: boolean;
    data: Pick<Types.ElementNodeData, 'id' | 'modelFqn' | 'navigateTo'> & BaseNodeData;
}> & WithExtraButtons;
/**
 * Center-Bottom action bar, includes zoom-in and browse relationships actions, if the features are enabled.
 * Intended to be used with model elements.
 *
 * Use generic {@link ElementActionButtons} for custom action buttons.
 *
 * @param extraButtons - Add extra action buttons
 *
 * @example
 * ```tsx
 * <ElementActions
 *   extraButtons={[
 *     {
 *       key: 'extra',
 *       icon: <IconZoomScan />,
 *       onClick: (e) => {
 *         e.stopPropagation()
 *         console.log('extra action clicked')
 *       },
 *       },
 *     },
 *   ]}
 * />
 * ```
 */
export declare function ElementActions({ extraButtons, ...props }: ElementActionsProps): import("react").JSX.Element;
export type DeploymentElementActionsProps = SimplifyDeep<{
    selected?: boolean;
    data: Pick<Types.DeploymentElementNodeData, 'id' | 'modelFqn' | 'navigateTo'> & BaseNodeData;
}> & WithExtraButtons;
/**
 * Center-Bottom action bar, includes zoom-in and browse relationships actions, if the features are enabled.
 * Intended to be used with deployment elements.
 *
 * Use generic {@link ElementActionButtons} for custom action buttons.
 *
 * @param extraButtons - Add extra action buttons
 *
 * @example
 * ```tsx
 * <DeploymentElementActions
 *   extraButtons={[
 *     {
 *       key: 'extra',
 *       icon: <IconZoomScan />,
 *       onClick: (e) => {
 *         e.stopPropagation()
 *         console.log('extra action clicked')
 *       },
 *       },
 *     },
 *   ]}
 * />
 * ```
 */
export declare const DeploymentElementActions: ({ extraButtons, ...props }: DeploymentElementActionsProps) => import("react").JSX.Element;
export {};
