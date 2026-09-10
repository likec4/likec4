import { useLikeC4Projects } from '@likec4/diagram'
import { css } from '@likec4/styles/css'
import { Txt } from '@likec4/styles/jsx'
import { Button, Menu, MenuDivider, MenuDropdown, MenuItem, MenuTarget, ScrollArea } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useCurrentProject } from '../../hooks'

export function SelectProject() {
  const projects = useLikeC4Projects()
  const project = useCurrentProject()

  if (projects.length < 2) return null

  return (
    <Menu
      width={'max-content'}
      trigger="click-hover"
      openDelay={300}
      closeDelay={200}
      position="bottom-start"
      classNames={{
        itemLabel: css({
          fontSize: 'sm',
        }),
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
          Overview
        </MenuItem>
        <MenuDivider />
        <ScrollArea.Autosize mah={'calc(100cqh - 200px)'}>
          {projects.map(({ id, title, path }) => (
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
              rightSection={!!path && <Txt fontSize={'xxs'} color={'text.non-essential'} truncate>{path}</Txt>}
            >
              {title ?? id}
            </MenuItem>
          ))}
        </ScrollArea.Autosize>
      </MenuDropdown>
    </Menu>
  )
}
