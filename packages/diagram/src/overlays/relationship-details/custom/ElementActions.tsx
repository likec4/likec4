import { IconFileSymlink, IconTransform, IconZoomScan } from '@tabler/icons-react'
import { ElementActionButtons } from '../../../base/primitives'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useCurrentViewId } from '../../../hooks/useCurrentViewId'
import { useDiagram } from '../../../hooks/useDiagram'
import type { RelationshipDetailsTypes as Types } from '../_types'

export const ElementActions = (props: Types.NodeProps<'element'>) => {
  const { enableNavigateTo, enableVscode } = useEnabledFeatures()
  const diagram = useDiagram()
  const currentViewId = useCurrentViewId()
  const buttons = [] as ElementActionButtons.Item[]

  const { navigateTo, fqn } = props.data
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
