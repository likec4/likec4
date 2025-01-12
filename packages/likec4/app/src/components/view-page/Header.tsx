import type { DiagramView } from '@likec4/core'
import {
  Button,
  Divider,
  Group,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  Paper,
  Space,
  useMantineTheme,
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { IconChevronDown, IconShare } from '@tabler/icons-react'
import { type RegisteredRouter, type RouteIds, Link, useParams, useRouterState } from '@tanstack/react-router'
import { usePreviewUrl } from 'virtual:likec4/previews'
import { ColorSchemeToggle } from '../ColorSchemeToggle'
import * as css from './Header.css'
import { ShareModal } from './ShareModal'

type RegisteredRoute = RouteIds<RegisteredRouter['routeTree']>

type HeaderProps = {
  diagram: DiagramView
}

export function Header({ diagram }: HeaderProps) {
  const routerState = useRouterState()
  const isReactDiagramRoute = routerState.matches.some(({ routeId }) =>
    routeId === '/view/$viewId/' || routeId === '/view/$viewId/editor'
  )

  const { breakpoints } = useMantineTheme()
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.md})`) ?? false
  const [opened, { open, close }] = useDisclosure(false)
  return (
    <Paper
      className={css.cssHeader}
      pos={'fixed'}
      top={'0.5rem'}
      right={'0.5rem'}
      p={4}
      radius={'sm'}
      shadow="lg">
      <Group gap={isTablet ? 6 : 4} wrap="nowrap">
        {isReactDiagramRoute
          ? (
            <>
              {/* <ViewPageButton isTablet={isTablet} /> */}

              <Button size={isTablet ? 'sm' : 'xs'} leftSection={<IconShare size={14} />} onClick={open}>
                Share
              </Button>
              <ExportButton />
            </>
          )
          : (
            <Button
              component={Link}
              to={'/view/$viewId/'}
              size={isTablet ? 'sm' : 'xs'}
              variant="subtle"
              color="gray">
              Back to diagram
            </Button>
          )}

        <Divider orientation="vertical" visibleFrom="md" />
        <ColorSchemeToggle />
        <Space />
      </Group>
      <ShareModal
        opened={opened}
        onClose={close}
        diagram={diagram} />
    </Paper>
  )
}

function ExportButton() {
  const params = useParams({
    from: '/view/$viewId',
  })
  const previewUrl = usePreviewUrl(params.viewId)

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
          Export
        </Button>
      </MenuTarget>

      <MenuDropdown>
        <MenuLabel>Current view</MenuLabel>
        {previewUrl
          ? (
            <MenuItem
              component={'a'}
              href={previewUrl}
              download={`${params.viewId}.png`}
              target="_blank">
              Export as .png
            </MenuItem>
          )
          : (
            <MenuItem
              renderRoot={(props) => (
                <Link
                  target="_blank"
                  to={'/export/$viewId'}
                  search={{ download: true }}
                  params={params}
                  {...props} />
              )}
            >
              Export as .png
            </MenuItem>
          )}
        <MenuItem
          renderRoot={(props) => (
            <Link
              to={'/view/$viewId/dot'}
              search
              params={params}
              {...props} />
          )}
        >
          Export as .dot
        </MenuItem>
        <MenuItem
          renderRoot={(props) => (
            <Link
              to={'/view/$viewId/d2'}
              search
              params={params}
              {...props} />
          )}
        >
          Export as .d2
        </MenuItem>
        <MenuItem
          renderRoot={(props) => (
            <Link
              to={'/view/$viewId/mmd'}
              search
              params={params}
              {...props} />
          )}>
          Export as .mmd
        </MenuItem>
        <MenuItem disabled>Export to Draw.io</MenuItem>
        <MenuItem disabled>Export to Miro</MenuItem>
        <MenuItem disabled>Export to Notion</MenuItem>
        {
          /*
        <MenuDivider />
        <MenuLabel>All views</MenuLabel>
        <MenuItem disabled>
          Download as ZIP
        </MenuItem> */
        }
      </MenuDropdown>
    </Menu>
  )
}
