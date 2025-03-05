import { usePlaygroundWorkspace } from '$hooks/usePlayground'
import { css } from '$styled-system/css'
import {
  Box,
  UnstyledButton,
} from '@mantine/core'

export function PlaygroundTitle() {
  const { workspaceTitle, isExample } = usePlaygroundWorkspace()

  if (isExample) {
    return <Box fz={'sm'} fw={500} visibleFrom="md">{workspaceTitle}</Box>
  }
  return <PlaygroundEditableTitle workspaceTitle={workspaceTitle} />
}

function PlaygroundEditableTitle({ workspaceTitle }: { workspaceTitle: string }) {
  // const { workspaceTitle, isExample } = usePlaygroundWorkspace()

  // if (isExample) {
  //   return <Box fz={'sm'} fw={500} visibleFrom="md">{workspaceTitle}</Box>
  // }
  return <UnstyledButton
    className={css({
      fontSize: 'sm',
      color: 'defaultText',
    })}
  >
    {workspaceTitle}
  </UnstyledButton>

  // <Box fz={'sm'} fw={500} visibleFrom="md">{workspaceTitle}</Box>
}
