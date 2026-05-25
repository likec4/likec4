import { useCallbackRef } from '@mantine/hooks'
import { IconZoomScan } from '@tabler/icons-react'
import { type MouseEvent, useMemo } from 'react'
import {
  DefaultHandles,
  ElementActionButtons,
  ElementData,
  ElementNodeContainer,
  ElementShape,
} from '../../base-primitives'
import type { ProjectsOverviewTypes } from '../_types'
import { useProjectsOverviewActor } from '../context'

export function ProjectNode(props: ProjectsOverviewTypes.NodeProps<'project'>) {
  const actor = useProjectsOverviewActor()

  const buttons = useMemo(() => [
    {
      key: 'navigate',
      icon: <IconZoomScan />,
      onClick: () => actor.send({ type: 'navigate.to', fromNode: props.data.id, projectId: props.data.projectId }),
    },
  ], [actor])

  return (
    <ElementNodeContainer
      key={props.id}
      layout
      nodeProps={props}
    >
      <ElementShape {...props} />
      <ElementData {...props} />
      <ElementActionButtons
        {...props}
        buttons={buttons} />
      <DefaultHandles />
      {/* <ElementActions {...props} /> */}
    </ElementNodeContainer>
  )
}
