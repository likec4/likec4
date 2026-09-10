import { css } from '@likec4/styles/css'
import { Box, HStack } from '@likec4/styles/jsx'
import { Button, Menu, MenuDropdown, MenuItem, MenuTarget, ScrollArea } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import { memo } from 'react'
import type { LikeC4ProjectsContext } from '../../context/LikeC4ProjectsContext'
import { useLikeC4ProjectId, useLikeC4ProjectsContext } from '../../hooks/useLikeC4Project'

export const ProjectsMenu = memo(_ => {
  const { projects, onProjectChange } = useLikeC4ProjectsContext()
  if (projects.length <= 1) {
    return null
  }

  return <WithProjectsMenu projects={projects} onProjectChange={onProjectChange} />
})

function WithProjectsMenu({
  projects,
  onProjectChange,
}: LikeC4ProjectsContext) {
  const projectId = useLikeC4ProjectId()
  return (
    <HStack gap="1" alignItems="baseline">
      <Box
        css={{
          fontWeight: 'normal',
          fontSize: 'xxs',
          color: 'text.dimmed',
          userSelect: 'none',
        }}>
        Project
      </Box>
      <Menu
        withinPortal={false} // if we render menu in portal, NavigationPanelDropdown receives onMouseLeave event
        shadow="md"
        position="bottom-start"
        classNames={{
          itemLabel: css({
            fontSize: 'xs',
          }),
        }}
        offset={{ mainAxis: 3 }}>
        <MenuTarget>
          <Button
            tabIndex={-1}
            autoFocus={false}
            variant="subtle"
            size="compact-xs"
            color="gray"
            radius={'sm'}
            classNames={{
              root: css({
                fontWeight: 'normal',
                fontSize: 'xxs',
                height: 'auto',
                lineHeight: 'tight',
                px: '1',
                py: '0.5',
              }),
              section: css({
                '&:is([data-position="right"])': {
                  marginInlineStart: '1',
                },
              }),
            }}
            rightSection={<IconChevronDown opacity={0.5} size={12} stroke={1.5} />}>
            {projectId}
          </Button>
        </MenuTarget>

        <MenuDropdown>
          <ScrollArea.Autosize mah={'calc(100cqh - 200px)'}>
            {projects.map(({ id, title }) => (
              <MenuItem
                key={id}
                onClick={(e) => {
                  if (projectId === id) {
                    e.stopPropagation()
                    return
                  }
                  onProjectChange(id)
                }}>
                {title ?? id}
              </MenuItem>
            ))}
          </ScrollArea.Autosize>
        </MenuDropdown>
      </Menu>
    </HStack>
  )
}
