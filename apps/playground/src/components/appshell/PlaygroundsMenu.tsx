import { useWorkspaces } from '$/hooks/useWorkspaces'
import { useWorkspaceIdFromRoute } from '$hooks/useWorkspaceIdFromRoute'
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

export function PlaygroundsMenu() {
  const router = useRouter()
  const workspaceId = useWorkspaceIdFromRoute()

  const [workspaces, {
    createNewFromBlank,
    createNewFromCurrent,
    removeWorkspace,
  }] = useWorkspaces()

  return (
    <>
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
          <MenuItem onClick={() => createNewFromBlank()}>
            New blank...
          </MenuItem>
          {workspaceId && (
            <MenuItem onClick={() => createNewFromCurrent()}>
              Copy current...
            </MenuItem>
          )}
          <MenuDivider />
          <MenuLabel>Examples</MenuLabel>
          <MenuItem
            renderRoot={(props) => (
              <Link to={'/w/$workspaceId/$viewId/'} params={{ workspaceId: 'tutorial', viewId: 'index' }} {...props} />
            )}>
            Tutorial
          </MenuItem>
          <MenuItem
            renderRoot={(props) => (
              <Link to={'/w/$workspaceId/$viewId/'} params={{ workspaceId: 'bigbank', viewId: 'index' }} {...props} />
            )}>
            BigBank
          </MenuItem>
          <MenuItem
            renderRoot={(props) => (
              <Link to={'/w/$workspaceId/$viewId/'} params={{ workspaceId: 'dynamic', viewId: 'index' }} {...props} />
            )}>
            Dynamic View
          </MenuItem>
          <MenuItem
            renderRoot={(props) => (
              <Link
                to={'/w/$workspaceId/$viewId/'}
                params={{ workspaceId: 'deployment', viewId: 'index' }}
                {...props} />
            )}>
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
                  to={'/w/$workspaceId/$viewId/'}
                  params={{ workspaceId: name, viewId: 'index' }}
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
    </>
  )
}
