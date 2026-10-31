import { useMemo } from 'react'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import type { MarkdownRefActions } from '../context/MarkdownRefsContext'
import { useDiagram } from './useDiagram'

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
  const openElement = overrides?.openElement
  const openView = overrides?.openView
  return useMemo(() => ({
    openElement: enableElementDetails
      ? openElement ?? (fqn => diagram.openNodeDetails({ type: 'element', element: fqn }))
      : null,
    openView: enableNavigateTo
      ? openView ?? (viewId => diagram.navigateTo(viewId))
      : null,
  }), [diagram, enableElementDetails, enableNavigateTo, openElement, openView])
}
