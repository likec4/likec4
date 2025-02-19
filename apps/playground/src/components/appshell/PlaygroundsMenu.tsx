import { Examples } from '$/examples'
import { usePlaygroundWorkspace } from '$/hooks/usePlayground'
import { useWorkspaces } from '$/hooks/useWorkspaces'
import { WorkspacePersistence } from '$state/persistence'
import {
  ActionIcon,
  Button,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
} from '@mantine/core'
import { IconChevronDown, IconTrash } from '@tabler/icons-react'
import { Link, useRouter } from '@tanstack/react-router'
import { nanoid } from 'nanoid'

export function PlaygroundsMenu() {
  const router = useRouter()
  const { workspaceId } = usePlaygroundWorkspace()
  const [workspaces, setWorkspaces] = useWorkspaces()

  const removeWorkspace = (name: string) => {
    const workspace = workspaces.find(w => w.name === name)
    if (!workspace) return
    setWorkspaces(workspaces.filter(w => w.name !== name))
    localStorage.removeItem(workspace.key)
  }

  const createNewWorkspace = (e: React.MouseEvent) => {
    e.stopPropagation()
    const workspaceId = nanoid(6)
    const title = `Blank ${workspaceId}`
    const key = WorkspacePersistence.write({
      workspaceId,
      activeFilename: Examples.blank.currentFilename,
      title,
      files: {
        ...Examples.blank.files,
      },
    })
    setWorkspaces((workspaces) => [
      ...workspaces,
      {
        key,
        name: workspaceId,
        title,
      },
    ])
    router.navigate({
      to: '/w/$workspaceId/$viewId/',
      params: {
        workspaceId,
        viewId: 'index',
      },
    })
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
        <MenuItem onClick={createNewWorkspace}>
          New blank...
        </MenuItem>
        <MenuDivider />
        <MenuLabel>Examples</MenuLabel>
        <MenuItem
          renderRoot={(props) => <Link {...props} to={'/w/$workspaceId/'} params={{ workspaceId: 'tutorial' }} />}>
          Tutorial
        </MenuItem>
        <MenuItem
          renderRoot={(props) => <Link {...props} to={'/w/$workspaceId/'} params={{ workspaceId: 'bigbank' }} />}>
          BigBank
        </MenuItem>
        <MenuItem
          renderRoot={(props) => <Link {...props} to={'/w/$workspaceId/'} params={{ workspaceId: 'dynamic' }} />}>
          Dynamic View
        </MenuItem>
        <MenuItem
          renderRoot={(props) => <Link {...props} to={'/w/$workspaceId/'} params={{ workspaceId: 'deployment' }} />}>
          Deployments
        </MenuItem>
        {workspaces.length > 0 && (
          <>
            <MenuDivider />
            <MenuLabel>Saved</MenuLabel>
          </>
        )}
        {workspaces.map(({ key, name, title }, i, all) => (
          <MenuItem
            key={key}
            renderRoot={(props) => (
              <Link
                to={'/w/$workspaceId/'}
                params={{ workspaceId: name }}
                activeProps={{
                  ['data-hovered']: true,
                }}
                {...props} />
            )}
            rightSection={
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  removeWorkspace(name)
                  if (workspaceId === name) {
                    router.navigate({
                      to: '/w/$workspaceId/$viewId/',
                      params: {
                        workspaceId: 'tutorial',
                        viewId: 'index',
                      },
                    })
                  }
                }}>
                <IconTrash size={14} />
              </ActionIcon>
            }
          >
            {title}
          </MenuItem>
        ))}
      </MenuDropdown>
    </Menu>
  )
}
