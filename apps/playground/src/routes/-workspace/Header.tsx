import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Group,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { IconAlertCircle, IconChevronDown, IconShare, IconTrash } from '@tabler/icons-react'
import { Link, useLoaderData } from '@tanstack/react-router'
import { nanoid } from 'nanoid'
import { memo } from 'react'
import { ColorSchemeToggle } from '../../components/ColorSchemeToggle'
import { Logo } from '../../components/Logo'
import { useWorkspaceState } from '../../state'
import { useWorkspaces } from '../../state/use-workspaces'

export const Header = memo(() => {
  const { isCustom, title } = useLoaderData({
    from: '/w/$id',
  })
  const isModified = useWorkspaceState(s => s.isModified())

  const isShareable = isCustom || isModified
  return (
    <Group h="100%" px="md" justify="space-between" align="stretch">
      <Group gap={'lg'} align="center" visibleFrom="sm">
        <Anchor href="https://likec4.dev/" target="_blank" display="contents">
          <Logo
            style={{
              height: 22,
            }} />
        </Anchor>
        <Box fz={'sm'} fw={500} visibleFrom="md">{title}</Box>
      </Group>

      <Group h="100%" gap={4}>
        {isShareable && (
          <Popover position="bottom" shadow="md" closeOnClickOutside>
            <PopoverTarget>
              <Button
                visibleFrom="md"
                leftSection={<IconShare size={14} />}
                size="xs">
                Share
              </Button>
            </PopoverTarget>
            <PopoverDropdown p={'xs'}>
              <Group>
                <ThemeIcon color="orange" variant="light">
                  <IconAlertCircle size={14} />
                </ThemeIcon>
                <Text c="orange" size="sm">In progress...</Text>
              </Group>
            </PopoverDropdown>
          </Popover>
        )}
        <PlaygroundsMenu />
        <Button
          component="a"
          href="https://likec4.dev/tutorial/"
          target="_blank"
          variant="subtle"
          px={'xs'}
          size="xs"
          color="gray">
          Docs
        </Button>
        <Button
          component="a"
          href="https://github.com/likec4/likec4"
          target="_blank"
          variant="subtle"
          px={'xs'}
          size="xs"
          visibleFrom="md"
          color="gray">
          GitHub
        </Button>
        <ColorSchemeToggle />
      </Group>
    </Group>
  )
})

function PlaygroundsMenu() {
  const current = useWorkspaceState(s => s.name)
  const [workspaces, setWorkspaces] = useWorkspaces()

  const removeWorkspace = (name: string) => {
    const workspace = workspaces.find(w => w.name === name)
    if (!workspace) return
    setWorkspaces(workspaces.filter(w => w.name !== name))
    localStorage.removeItem(workspace.key)
  }

  return (
    <Menu shadow="md" trigger="click-hover" openDelay={200}>
      <MenuTarget>
        <Button
          variant="subtle"
          px={'xs'}
          size="xs"
          color="gray"
          rightSection={<IconChevronDown opacity={0.5} size={14} />}>
          Playgrounds
        </Button>
      </MenuTarget>

      <MenuDropdown>
        <MenuItem renderRoot={(props) => <Link {...props} to={'/w/$id/'} params={{ id: nanoid(6) }} />}>
          New blank...
        </MenuItem>
        <MenuDivider />
        <MenuLabel>Examples</MenuLabel>
        <MenuItem renderRoot={(props) => <Link {...props} to={'/w/$id/'} params={{ id: 'tutorial' }} />}>
          Tutorial
        </MenuItem>
        <MenuItem renderRoot={(props) => <Link {...props} to={'/w/$id/'} params={{ id: 'bigbank' }} />}>
          BigBank
        </MenuItem>
        <MenuItem renderRoot={(props) => <Link {...props} to={'/w/$id/'} params={{ id: 'dynamic' }} />}>
          Dynamic View
        </MenuItem>
        <MenuItem renderRoot={(props) => <Link {...props} to={'/w/$id/'} params={{ id: 'deployment' }} />}>
          Deployments
        </MenuItem>
        {workspaces.length > 0 && (
          <>
            <MenuDivider />
            <MenuLabel>Saved</MenuLabel>
          </>
        )}
        {workspaces.map(({ key, name, title }) => (
          <MenuItem
            key={key}
            renderRoot={(props) => (
              <Link
                to={'/w/$id/'}
                params={{ id: name }}
                activeProps={{
                  ['data-hovered']: true,
                }}
                {...props} />
            )}
            rightSection={current !== name
              ? (
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeWorkspace(name)
                  }}>
                  <IconTrash size={14} />
                </ActionIcon>
              )
              : null}
          >
            {title}
          </MenuItem>
        ))}
      </MenuDropdown>
    </Menu>
  )
}
