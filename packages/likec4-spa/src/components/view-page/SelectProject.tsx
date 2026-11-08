import { filterProjects, projectSearchHighlights, useLikeC4Projects } from '@likec4/diagram'
import { css } from '@likec4/styles/css'
import { Txt } from '@likec4/styles/jsx'
import {
  Button,
  Highlight,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuSearch,
  MenuTarget,
  ScrollArea,
} from '@mantine/core'
import { IconChevronDown, IconSearch } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useCurrentProject } from '../../hooks'

export function SelectProject() {
  const projects = useLikeC4Projects()
  const currentProject = useCurrentProject()
  const [search, setSearch] = useState('')

  if (projects.length < 2) return null

  const found = filterProjects(projects, search)
  const highlight = projectSearchHighlights(search)

  return (
    <Menu
      width={'max-content'}
      trigger="click"
      position="bottom-start"
      classNames={{
        itemSection: css({
          maxWidth: '[250px]',
        }),
      }}>
      <MenuTarget>
        <Button
          variant="subtle"
          size="compact-md"
          fz={'sm'}
          color="gray"
          px={'sm'}
          maw="250"
          rightSection={<IconChevronDown opacity={0.5} size={14} />}
          visibleFrom="md">
          {currentProject.title ?? currentProject.id}
        </Button>
      </MenuTarget>

      <MenuDropdown>
        <MenuSearch
          miw={300}
          mb={4}
          placeholder={`Search ${projects.length} projects (* wildcard)`}
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
        />
        <MenuItem
          renderRoot={(props) => (
            <Link
              {...props}
              to={'/projects'}
            />
          )}
        >
          Overview
        </MenuItem>
        <MenuDivider />
        <ScrollArea.Autosize mah={'min(65vh, 560px)'} type="auto">
          {found.length === 0 && (
            <Txt fontSize="sm" color="text.dimmed" px="3" py="1.5">
              No matching project
            </Txt>
          )}
          {found.map(({ id, title, path }) => (
            <MenuItem
              key={id}
              renderRoot={(props) => (
                <Link
                  {...(props as {})}
                  to={'/project/$projectId/view/$viewId/'}
                  params={{
                    projectId: id,
                    viewId: 'index',
                  }}
                />
              )}
              rightSection={!!path && (
                <Txt fontSize={'xxs'} color={'text.non-essential'} truncate>
                  <Highlight component="span" highlight={highlight} inherit>{path}</Highlight>
                </Txt>
              )}
            >
              <Txt
                fontSize="sm"
                truncate
                maxWidth={'[300px]'}
                css={currentProject.id === id ? { color: 'text.bright', fontWeight: 'semibold' } : {}}>
                <Highlight component="span" highlight={highlight} inherit>{title ?? id}</Highlight>
              </Txt>
            </MenuItem>
          ))}
        </ScrollArea.Autosize>
      </MenuDropdown>
    </Menu>
  )
}
