import { css } from '@likec4/styles/css'
import { Box, HStack } from '@likec4/styles/jsx'
import { Button, Highlight, Menu, MenuDropdown, MenuItem, MenuSearch, MenuTarget, ScrollArea } from '@mantine/core'
import { IconChevronDown, IconSearch } from '@tabler/icons-react'
import { memo, useState } from 'react'
import type { LikeC4ProjectsContext } from '../../context/LikeC4ProjectsContext'
import { useLikeC4ProjectId, useLikeC4ProjectsContext } from '../../hooks/useLikeC4Project'
import { filterProjects, projectSearchHighlights } from '../../utils/filterProjects'

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
  const [search, setSearch] = useState('')
  const found = filterProjects(projects, search)
  const highlight = projectSearchHighlights(search)
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
        width={300}
        classNames={{
          itemLabel: css({
            fontSize: 'xs',
            truncate: true,
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
            maw={300}
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
          <MenuSearch
            size="xs"
            mb={4}
            placeholder={`Search ${projects.length} projects (* wildcard)`}
            leftSection={<IconSearch size={12} />}
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
          />
          <ScrollArea.Autosize mah={'min(60vh, 420px)'} type="auto">
            {found.length === 0 && (
              <Box css={{ fontSize: 'xs', color: 'text.dimmed', px: '2', py: '1' }}>
                No matching project
              </Box>
            )}
            {found.map(({ id, title }) => (
              <MenuItem
                key={id}
                fw={projectId === id ? 600 : undefined}
                rightSection={title && title !== id && (
                  <Highlight component="span" highlight={highlight} fz={'10px'} c="dimmed">
                    {id}
                  </Highlight>
                )}
                onClick={(e) => {
                  if (projectId === id) {
                    e.stopPropagation()
                    return
                  }
                  onProjectChange(id)
                }}>
                <Highlight component="span" highlight={highlight} inherit>
                  {title ?? id}
                </Highlight>
              </MenuItem>
            ))}
          </ScrollArea.Autosize>
        </MenuDropdown>
      </Menu>
    </HStack>
  )
}
