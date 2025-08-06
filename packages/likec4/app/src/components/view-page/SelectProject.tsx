import { Button, Menu, MenuDropdown, MenuItem, MenuTarget } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { projects } from 'likec4:projects'
import { useLikeC4ModelDataAtom } from '../../context/LikeC4ModelContext'

export function SelectProject() {
  const model = useLikeC4ModelDataAtom()

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
          {model.value?.project.config?.title ?? model.value?.project.id}
        </Button>
      </MenuTarget>

      <MenuDropdown>
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
