import { IconFileSymlink, IconTransform, IconZoomScan } from '@tabler/icons-react'
import { useMemo } from 'react'
import { ElementActionButtons } from '../../../base-primitives'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useCurrentViewId } from '../../../hooks/useCurrentView'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipsBrowserTypes as Types } from '../_types'
import type { RelationshipsBrowserSnapshot } from '../actor'
import { useRelationshipsBrowser, useRelationshipsBrowserState } from '../hooks'

const selectSubject = (state: RelationshipsBrowserSnapshot) => state.context.subject

export const ElementActions = (props: Types.NodeProps<'element'>) => {
  const { enableNavigateTo, enableVscode } = useEnabledFeatures()
  const diagram = useDiagram()
  const currentViewId = useCurrentViewId()
  const browser = useRelationshipsBrowser()
  const subject = useRelationshipsBrowserState(selectSubject)
  const { navigateTo, fqn } = props.data

  const buttons = useMemo(() => {
    const buttons: ElementActionButtons.Item[] = []

    if (navigateTo && enableNavigateTo && currentViewId !== navigateTo) {
      buttons.push({
        key: 'navigate',
        icon: <IconZoomScan />,
        onClick: (e) => {
          e.stopPropagation()
          diagram.navigateTo(navigateTo)
        },
      })
    }
    if (fqn !== subject) {
      buttons.push({
        key: 'relationships',
        icon: <IconTransform />,
        onClick: (e) => {
          e.stopPropagation()
          browser.navigateTo(fqn, props.id)
        },
      })
    }
    if (enableVscode) {
      buttons.push({
        key: 'goToSource',
        icon: <IconFileSymlink />,
        onClick: (e) => {
          e.stopPropagation()
          diagram.openSource({ element: fqn })
        },
      })
    }
    return buttons
  }, [navigateTo, enableNavigateTo, currentViewId, fqn, subject, enableVscode, diagram, browser, props.id])

  return (
    <ElementActionButtons
      buttons={buttons}
      {...props}
    />
  )
}
