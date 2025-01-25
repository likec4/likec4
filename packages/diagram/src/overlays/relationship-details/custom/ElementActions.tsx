import { IconZoomScan } from '@tabler/icons-react'
import { ElementActionButtons } from '../../../base/primitives'
import type { NodeProps } from '../../../base/types'
import { useEnabledFeature } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipDetailsTypes as Types } from '../_types'
import { useRelationshipDetails } from '../hooks'
// import { useRelationshipsBrowser } from '../hooks'

type ElementActionsProps = NodeProps<Types.ElementNodeData>
export const ElementActions = (props: ElementActionsProps) => {
  const { enableNavigateTo } = useEnabledFeature('NavigateTo')
  const diagram = useDiagram()
  const browser = useRelationshipDetails()

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
  // if (fqn !== browser.getState().subject) {
  //   buttons.push({
  //     key: 'relationships',
  //     icon: <IconTransform />,
  //     onClick: (e) => {
  //       e.stopPropagation()
  //       browser.navigateTo(fqn)
  //     },
  //   })
  // }
  return (
    <ElementActionButtons
      buttons={buttons}
      {...props}
    />
  )
}
