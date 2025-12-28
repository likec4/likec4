import { useCallbackRef } from '@mantine/hooks'
import { IconZoomScan } from '@tabler/icons-react'
import type { MouseEvent } from 'react'
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

  const navigateTo = useCallbackRef((e: MouseEvent) => {
    e.stopPropagation()
    actor.send({ type: 'navigate.to', fromNode: props.data.id, projectId: props.data.projectId })
  })

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
        buttons={[
          {
            key: 'navigate',
            icon: <IconZoomScan />,
            onClick: navigateTo,
          },
        ]} />
      <DefaultHandles />
      {/* <ElementActions {...props} /> */}
    </ElementNodeContainer>
  )
}
