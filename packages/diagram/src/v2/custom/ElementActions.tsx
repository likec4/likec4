import type { NodeId } from '@likec4/core'
import { IconTransform, IconZoomScan } from '@tabler/icons-react'
import { ElementActionButtons } from '../../base/primitives'
import type { NodeProps } from '../../base/types'
import { useEnabledFeature } from '../../context'
import { useDiagram } from '../hooks/useDiagram'
import type { Types } from '../types'

type ElementActionsProps = NodeProps<Types.ElementNodeData>
export const ElementActions = (props: ElementActionsProps) => {
  const { enableNavigateTo, enableRelationshipBrowser } = useEnabledFeature('RelationshipBrowser', 'NavigateTo')
  const diagram = useDiagram()

  const buttons = [] as ElementActionButtons.Item[]

  const { navigateTo, fqn } = props.data
  if (navigateTo && enableNavigateTo) {
    buttons.push({
      key: 'navigate',
      icon: <IconZoomScan />,
      onClick: (e) => {
        e.stopPropagation()
        diagram.navigateTo(navigateTo, props.id as NodeId)
      },
    })
  }
  if (enableRelationshipBrowser) {
    buttons.push({
      key: 'relationships',
      icon: <IconTransform />,
      onClick: (e) => {
        e.stopPropagation()
        // store.getState().openOverlay({ relationshipsOf: fqn })
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
