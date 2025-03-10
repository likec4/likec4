import {
  type ElementProps,
  type UnstyledButtonProps,
  Box,
  createScopedKeydownHandler,
  Group,
  UnstyledButton,
} from '@mantine/core'
import clsx from 'clsx'

export function ProjectButton({ project, navigateTo, className, ...props }:
  & {
    project: string
    navigateTo: (projectId: string) => void
  }
  & UnstyledButtonProps
  & ElementProps<'button'>)
{
  return (
    <UnstyledButton
      {...props}
      className={clsx(className)}
      data-likec4-project={project}
      onClick={(e) => {
        e.stopPropagation()
        navigateTo(project)
      }}
      onKeyDown={createScopedKeydownHandler({
        siblingSelector: '[data-likec4-project]',
        parentSelector: '[data-likec4-projects]',
        activateOnFocus: false,
        loop: true,
        orientation: 'vertical',
        onKeyDown: (e) => {
          if (e.nativeEvent.code === 'Space') {
            e.stopPropagation()
            navigateTo(project)
          }
        },
      })}>
      {
        /* <ThemeIcon variant="transparent">
        {isDeploymentView(view)
          ? <IconStack2 stroke={1.8} />
          : <IconZoomScan stroke={1.8} />}
      </ThemeIcon> */
      }
      <Box style={{ flexGrow: 1 }}>
        <Group gap={'xs'} wrap="nowrap" align="center">
          {project}
        </Group>
      </Box>
    </UnstyledButton>
  )
}
