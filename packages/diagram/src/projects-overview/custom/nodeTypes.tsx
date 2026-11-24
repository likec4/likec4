import { useCallbackRef } from '@mantine/hooks'
import { IconFocusCentered, IconZoomScan } from '@tabler/icons-react'
import type { MouseEvent } from 'react'
import {
  CompoundActionButton,
  CompoundNodeContainer,
  CompoundTitle,
  DefaultHandles,
  ElementActionButtons,
  ElementData,
  ElementNodeContainer,
  ElementShape,
} from '../../base-primitives'
import type { ProjectsOverviewTypes } from '../_types'
import { useProjectsOverviewActor } from '../context'
import { HubCounts } from './HubCounts'

export function ProjectNode(props: ProjectsOverviewTypes.NodeProps<'project'>) {
  const actor = useProjectsOverviewActor()

  const navigateTo = useCallbackRef((e: MouseEvent) => {
    e.stopPropagation()
    actor.send({ type: 'navigate.to', fromNode: props.data.id, projectId: props.data.projectId })
  })

  const focus = useCallbackRef((e: MouseEvent) => {
    e.stopPropagation()
    actor.send({ type: 'project.focus', nodeId: props.id })
  })

  return (
    <ElementNodeContainer
      key={props.id}
      layout
      nodeProps={props}
    >
      <ElementShape {...props} />
      <ElementData {...props} />
      <HubCounts color={props.data.color} fanIn={props.data.fanIn} fanOut={props.data.fanOut} />
      <ElementActionButtons
        {...props}
        buttons={[
          {
            key: 'focus',
            ariaLabel: 'Highlight connected projects',
            icon: <IconFocusCentered />,
            onClick: focus,
          },
          {
            key: 'navigate',
            icon: <IconZoomScan />,
            onClick: navigateTo,
          },
        ]} />
      <DefaultHandles />
    </ElementNodeContainer>
  )
}

export function GroupNode(props: ProjectsOverviewTypes.NodeProps<'project-group'>) {
  const actor = useProjectsOverviewActor()

  const showOnlyThis = useCallbackRef((e: MouseEvent) => {
    e.stopPropagation()
    actor.send({ type: 'frame.focus', frameId: props.id })
  })

  return (
    <CompoundNodeContainer nodeProps={props}>
      <CompoundTitle {...props} aria-hidden />
      <CompoundActionButton
        {...props}
        icon={<IconFocusCentered />}
        ariaLabel="Show only this frame"
        onClick={showOnlyThis}
      />
    </CompoundNodeContainer>
  )
}
