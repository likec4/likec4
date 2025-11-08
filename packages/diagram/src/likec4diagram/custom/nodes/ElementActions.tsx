import { IconTransform, IconZoomScan } from '@tabler/icons-react'
import { deepEqual as eq, shallowEqual } from 'fast-equals'
import { memo, useMemo } from 'react'
import { hasAtLeast } from 'remeda'
import type { SimplifyDeep } from 'type-fest'
import { ElementActionButtons } from '../../../base-primitives'
import type { BaseNodeData } from '../../../base/types'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { Types } from '../../types'

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
  extraButtons?: ElementActionButtons.Item[]
}

export type ElementActionsProps =
  & SimplifyDeep<{
    selected?: boolean
    data: Pick<Types.ElementNodeData, 'id' | 'modelFqn' | 'navigateTo'> & BaseNodeData
  }>
  & WithExtraButtons

const compareElementActionsProps = (a: ElementActionsProps, b: ElementActionsProps) => {
  return eq(a.data.id, b.data.id)
    && eq(a.selected ?? false, b.selected ?? false)
    && eq(a.data.modelFqn ?? null, b.data.modelFqn ?? null)
    && eq(a.data.navigateTo ?? null, b.data.navigateTo ?? null)
    && eq(a.data.hovered ?? false, b.data.hovered ?? false)
    && (
      (!a.extraButtons && !b.extraButtons)
      || shallowEqual(a.extraButtons, b.extraButtons)
    )
}

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
export const ElementActions = memo<ElementActionsProps>(({
  extraButtons,
  ...props
}) => {
  const { enableNavigateTo, enableRelationshipBrowser } = useEnabledFeatures()
  const diagram = useDiagram()
  const { id, navigateTo, modelFqn } = props.data
  let buttons = useMemo(() => {
    const buttons = [] as ElementActionButtons.Item[]

    if (navigateTo && enableNavigateTo) {
      buttons.push({
        key: 'navigate',
        icon: <IconZoomScan />,
        onClick: (e) => {
          e.stopPropagation()
          diagram.navigateTo(navigateTo, id)
        },
      })
    }
    if (enableRelationshipBrowser) {
      buttons.push({
        key: 'relationships',
        icon: <IconTransform />,
        onClick: (e) => {
          e.stopPropagation()
          diagram.openRelationshipsBrowser(modelFqn)
        },
      })
    }
    return buttons
  }, [enableNavigateTo, enableRelationshipBrowser, modelFqn, navigateTo, id])

  if (extraButtons && hasAtLeast(extraButtons, 1)) {
    buttons = [...buttons, ...extraButtons]
  }

  // Spread all ReactFlow node props and override buttons with our computed buttons
  return <ElementActionButtons {...props} buttons={buttons} />
}, compareElementActionsProps)

export type DeploymentElementActionsProps =
  & SimplifyDeep<{
    selected?: boolean
    data: Pick<Types.DeploymentElementNodeData, 'id' | 'modelFqn' | 'navigateTo'> & BaseNodeData
  }>
  & WithExtraButtons

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
export const DeploymentElementActions = ({
  extraButtons,
  ...props
}: DeploymentElementActionsProps) => {
  const { enableNavigateTo, enableRelationshipBrowser } = useEnabledFeatures()
  const diagram = useDiagram()
  const { id, navigateTo, modelFqn } = props.data

  let buttons = useMemo(() => {
    const buttons = [] as ElementActionButtons.Item[]

    if (navigateTo && enableNavigateTo) {
      buttons.push({
        key: 'navigate',
        icon: <IconZoomScan />,
        onClick: (e) => {
          e.stopPropagation()
          diagram.navigateTo(navigateTo, id)
        },
      })
    }
    if (enableRelationshipBrowser && !!modelFqn) {
      buttons.push({
        key: 'relationships',
        icon: <IconTransform />,
        onClick: (e) => {
          e.stopPropagation()
          diagram.openRelationshipsBrowser(modelFqn)
        },
      })
    }
    return buttons
  }, [enableNavigateTo, enableRelationshipBrowser, modelFqn, navigateTo, id])

  if (extraButtons && hasAtLeast(extraButtons, 1)) {
    buttons = [...buttons, ...extraButtons]
  }

  // Spread all ReactFlow node props and override buttons with our computed buttons
  return <ElementActionButtons {...props} buttons={buttons} />
}
