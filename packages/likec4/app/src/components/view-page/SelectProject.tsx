import { useLikeC4Projects } from '@likec4/diagram'
import { Button, Menu, MenuDivider, MenuDropdown, MenuItem, MenuTarget } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useCurrentProject } from '../../hooks'

export function SelectProject() {
  const projects = useLikeC4Projects()
  const project = useCurrentProject()

  if (projects.length < 2) return null

  return (
    <Menu shadow="md" width={200} trigger="click-hover" openDelay={200}>
      <MenuTarget>
        <Button
          variant="subtle"
          size="sm"
          color="gray"
          px={'sm'}
          rightSection={<IconChevronDown opacity={0.5} size={14} />}
          visibleFrom="md">
          {project.title ?? project.id}
        </Button>
      </MenuTarget>

      <MenuDropdown>
        <MenuItem
          renderRoot={(props) => (
            <Link
              {...props}
              to={'/projects'}
            />
          )}
        >
          Projects overview
        </MenuItem>
        <MenuDivider />
        {projects.map(({ id, title }) => (
          <MenuItem
            key={id}
            renderRoot={(props) => (
              <Link
                {...props}
                to={'/project/$projectId/view/$viewId/'}
                params={{
                  projectId: id,
                  viewId: 'index',
                }}
              />
            )}
          >
            {title ?? id}
          </MenuItem>
        ))}
      </MenuDropdown>
    </Menu>
  )
}
