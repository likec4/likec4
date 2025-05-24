import type { NodeId } from '@likec4/core'
import { IconTransform, IconZoomScan } from '@tabler/icons-react'
import { useMemo } from 'react'
import { ElementActionButtons } from '../../../base/primitives'
import type { NodeProps } from '../../../base/types'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { Types } from '../../types'

type ElementActionsProps = NodeProps<Types.ElementNodeData>
export const ElementActions = (props: ElementActionsProps) => {
  const { enableNavigateTo, enableRelationshipBrowser } = useEnabledFeatures()
  const diagram = useDiagram()
  const { navigateTo, modelFqn } = props.data
  const buttons = useMemo(() => {
    const buttons = [] as ElementActionButtons.Item[]

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
          diagram.openRelationshipsBrowser(modelFqn)
        },
      })
    }
    return buttons
  }, [enableNavigateTo, enableRelationshipBrowser, diagram, modelFqn, navigateTo, props.id])

  return (
    <ElementActionButtons
      buttons={buttons}
      {...props}
    />
  )
}

type DeploymentElementActionsProps = NodeProps<Types.DeploymentElementNodeData>
export const DeploymentElementActions = (props: DeploymentElementActionsProps) => {
  const { enableNavigateTo, enableRelationshipBrowser } = useEnabledFeatures()
  const diagram = useDiagram()
  const { navigateTo, modelFqn } = props.data

  const buttons = useMemo(() => {
    const buttons = [] as ElementActionButtons.Item[]

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
  }, [enableNavigateTo, enableRelationshipBrowser, diagram, modelFqn, navigateTo, props.id])

  return <ElementActionButtons buttons={buttons} {...props} />
}
