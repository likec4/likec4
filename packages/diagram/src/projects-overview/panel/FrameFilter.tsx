import { ActionIcon, Checkbox, Group } from '@mantine/core'
import { IconFocusCentered } from '@tabler/icons-react'
import type { ProjectsOverviewTypes } from '../_types'
import { useProjectsOverviewActor } from '../context'

/**
 * Frames as a tree. A checked frame is shown. Its projects and edges hide with it.
 */
export function FrameFilter({ nodes, hiddenGroups }: {
  nodes: ReadonlyArray<ProjectsOverviewTypes.Node>
  hiddenGroups: ReadonlyArray<string>
}) {
  const actor = useProjectsOverviewActor()
  const frames = nodes.filter((node): node is ProjectsOverviewTypes.GroupNode => node.type === 'project-group')

  return (
    <>
      {frames.map(frame => (
        <Group key={frame.id} gap={4} wrap="nowrap" pl={frame.data.depth * 12}>
          <Checkbox
            size="xs"
            label={frame.data.title}
            checked={!hiddenGroups.includes(frame.id)}
            onChange={() => actor.send({ type: 'group.toggle', frameId: frame.id })}
          />
          <ActionIcon
            size="xs"
            variant="subtle"
            aria-label={`Show only ${frame.data.title}`}
            onClick={() => actor.send({ type: 'frame.focus', frameId: frame.id })}
          >
            <IconFocusCentered size={12} />
          </ActionIcon>
        </Group>
      ))}
    </>
  )
}
