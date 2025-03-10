import { Button, Menu, MenuDropdown, MenuItem, MenuTarget } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { projects } from 'virtual:likec4/projects'
import { useCurrentProjectd } from '../../hooks'

export function SelectProject() {
  const projectId = useCurrentProjectd()

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
          {projectId}
        </Button>
      </MenuTarget>

      <MenuDropdown>
        {projects.map((projectId) => (
          <MenuItem
            key={projectId}
            renderRoot={(props) => (
              <Link
                target="_blank"
                to={'/project/$projectId/'}
                params={{
                  projectId,
                }}
                {...props} />
            )}
          >
            {projectId}
          </MenuItem>
        ))}
      </MenuDropdown>
    </Menu>
  )
}
