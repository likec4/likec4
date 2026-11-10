import type { Fqn, ViewId } from '@likec4/core/types'
import { useMemo } from 'react'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { useCallbackRef } from './useCallbackRef'
import { useDiagram } from './useDiagram'

/**
 * Actions for links to elements and views in Markdown (`[[fqn]]`, `[[view:id]]`).
 * A `null` action means the respective refs are rendered as plain text.
 */
export type MarkdownRefActions = {
  openElement: ((fqn: Fqn) => void) | null
  openView: ((viewId: ViewId) => void) | null
}

/**
 * Default actions for refs in Markdown inside diagram overlays and panels:
 * element ref opens element details, view ref navigates to the view.
 * Actions of disabled features are `null`, so these refs render as plain text.
 *
 * @param overrides - replace default actions (still `null` if the feature is disabled)
 */
export function useDiagramMarkdownRefActions(
  overrides?: { [K in keyof MarkdownRefActions]?: NonNullable<MarkdownRefActions[K]> },
): MarkdownRefActions {
  const diagram = useDiagram()
  const { enableElementDetails, enableNavigateTo } = useEnabledFeatures()
  const openElement = useCallbackRef((fqn: Fqn) => {
    if (overrides?.openElement) {
      return overrides.openElement(fqn)
    }
    return diagram.openNodeDetails({ type: 'element', element: fqn })
  })
  const openView = useCallbackRef((viewId: ViewId) => {
    if (overrides?.openView) {
      return overrides.openView(viewId)
    }
    return diagram.navigateTo(viewId)
  })
  return useMemo(() => ({
    openElement: enableElementDetails ? openElement : null,
    openView: enableNavigateTo ? openView : null,
  }), [enableElementDetails, enableNavigateTo])
}
