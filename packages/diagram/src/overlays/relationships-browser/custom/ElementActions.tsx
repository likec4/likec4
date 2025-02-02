import { IconFileSymlink, IconTransform, IconZoomScan } from '@tabler/icons-react'
import { ElementActionButtons } from '../../../base/primitives'
import type { NodeProps } from '../../../base/types'
import { useEnabledFeature } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipsBrowserTypes as Types } from '../_types'
import { useRelationshipsBrowser } from '../hooks'

type ElementActionsProps = NodeProps<Types.ElementNodeData>
export const ElementActions = (props: ElementActionsProps) => {
  const { enableNavigateTo, enableVscode } = useEnabledFeature('NavigateTo', 'Vscode')
  const diagram = useDiagram()
  const browser = useRelationshipsBrowser()

  const buttons = [] as ElementActionButtons.Item[]

  const { navigateTo, fqn } = props.data
  if (navigateTo && enableNavigateTo) {
    buttons.push({
      key: 'navigate',
      icon: <IconZoomScan />,
      onClick: (e) => {
        e.stopPropagation()
        diagram.navigateTo(navigateTo)
      },
    })
  }
  if (fqn !== browser.getState().subject) {
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
  return (
    <ElementActionButtons
      buttons={buttons}
      {...props}
    />
  )
}
