import { css } from '@likec4/styles/css'
import { Box, HStack } from '@likec4/styles/jsx'
import { type ButtonProps, Button, Menu, MenuDropdown, MenuItem, MenuTarget } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import { useLikeC4ProjectId, useLikeC4ProjectsContext } from '../../likec4model/useLikeC4Project'

export function ProjectsMenu(props: ButtonProps) {
  const { projects, onProjectChange } = useLikeC4ProjectsContext()
  const projectId = useLikeC4ProjectId()

  if (projects.length <= 1) {
    return null
  }

  return (
    <HStack gap={2} alignItems={'baseline'}>
      <Box
        css={{
          fontWeight: 400,
          fontSize: 'xxs',
          color: 'mantine.colors.dimmed',
        }}>
        Project
      </Box>
      <Menu shadow="md" position="bottom-start" offset={{ mainAxis: 2 }} closeOnItemClick>
        <MenuTarget>
          <Button
            autoFocus={false}
            variant="subtle"
            size="compact-xs"
            color="gray"
            classNames={{
              root: css({
                fontWeight: 400,
                fontSize: 'xxs',
                height: 'auto',
              }),
              section: css({
                '&:is([data-position="right"])': {
                  marginInlineStart: '4',
                },
              }),
            }}
            // color="gray"
            // px={'sm'}
            rightSection={<IconChevronDown opacity={0.5} size={14} />}
            {...props}>
            {projectId}
          </Button>
        </MenuTarget>

        <MenuDropdown>
          {projects.map((project) => (
            <MenuItem
              key={project.id}
              onClick={(e) => {
                if (projectId === project.id) {
                  e.stopPropagation()
                  return
                }
                onProjectChange(project.id)
              }}>
              {project.id}
            </MenuItem>
          ))}
        </MenuDropdown>
      </Menu>
    </HStack>
  )
}
