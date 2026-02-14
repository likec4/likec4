import { usePlaygroundWorkspace } from '$hooks/usePlayground';
import { css } from '@likec4/styles/css';
import { Box, UnstyledButton, } from '@mantine/core';
export function PlaygroundTitle() {
    const { workspaceTitle, isExample } = usePlaygroundWorkspace();
    if (isExample) {
        return <Box fz={'sm'} fw={500} visibleFrom="md">{workspaceTitle}</Box>;
    }
    return <PlaygroundEditableTitle workspaceTitle={workspaceTitle}/>;
}
function PlaygroundEditableTitle({ workspaceTitle }) {
    // const { workspaceTitle, isExample } = usePlaygroundWorkspace()
    // if (isExample) {
    //   return <Box fz={'sm'} fw={500} visibleFrom="md">{workspaceTitle}</Box>
    // }
    return <UnstyledButton className={css({
            fontSize: 'sm',
            color: 'text',
        })}>
    {workspaceTitle}
  </UnstyledButton>;
    // <Box fz={'sm'} fw={500} visibleFrom="md">{workspaceTitle}</Box>
}
