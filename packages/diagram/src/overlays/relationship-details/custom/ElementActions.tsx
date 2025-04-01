import { IconFileSymlink, IconTransform, IconZoomScan } from '@tabler/icons-react'
import { ElementActionButtons } from '../../../base/primitives'
import type { NodeProps } from '../../../base/types'
import { useEnabledFeature } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipDetailsTypes as Types } from '../_types'
import { useRelationshipDetails } from '../hooks'

type ElementActionsProps = NodeProps<Types.ElementNodeData>
export const ElementActions = (props: ElementActionsProps) => {
  const { enableNavigateTo, enableVscode } = useEnabledFeature('NavigateTo', 'Vscode')
  const diagram = useDiagram()

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
  if (fqn) {
    buttons.push({
      key: 'relationships',
      icon: <IconTransform />,
      onClick: (e) => {
        e.stopPropagation()
        diagram.openRelationshipsBrowser(fqn)
      },
    })
  }
  if (fqn && enableVscode) {
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
