import { useLikeC4Projects } from '@likec4/diagram'
import { Box } from '@likec4/styles/jsx'
import {
  Button,
  Divider,
  Group,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  Space,
  useMantineTheme,
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { IconChevronDown, IconShare } from '@tabler/icons-react'
import {
  Link,
  useMatches,
  useParams,
} from '@tanstack/react-router'
import { memo } from 'react'
import { useCurrentViewId } from '../../hooks'
import { ColorSchemeToggle } from '../ColorSchemeToggle'
import * as styles from './Header.css'
import { SelectProject } from './SelectProject'
import { ShareModal } from './ShareModal'

export const Header = memo(() => {
  const projects = useLikeC4Projects()
  const isReactDiagramRoute = useMatches({
    select(matches) {
      return matches.some(({ routeId }) =>
        routeId === '/_single/view/$viewId/'
        || routeId === '/_single/view/$viewId/editor'
        || routeId === '/project/$projectId/view/$viewId'
      )
    },
  })
  const { breakpoints } = useMantineTheme()
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.md})`) ?? false
  const [opened, { open, close }] = useDisclosure(false)

  return (
    <Box
      className={styles.cssHeader}>
      <Group gap={isTablet ? 6 : 4} wrap="nowrap">
        {isReactDiagramRoute
          ? (
            <>
              <SelectProject />
              {projects.length <= 1 && (
                <Button
                  size={isTablet ? 'sm' : 'xs'}
                  leftSection={<IconShare size={14} />}
                  onClick={open}>
                  Share
                </Button>
              )}
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
      {opened && <ShareModal onClose={close} />}
    </Box>
  )
})

const enableDownload = <P extends Record<string, unknown>>(params: P): P & { download: true } => ({
  ...params,
  download: true,
})

function ExportButton() {
  const params = useParams({ strict: false })
  const isInsideProject = useMatches({
    select: matches => matches.some(({ routeId }) => routeId === '/project/$projectId'),
  })
  const viewId = useCurrentViewId()

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
        <MenuItem
          renderRoot={(props) => (
            <Link
              target="_blank"
              to={isInsideProject ? '/project/$projectId/export/$viewId/' : '/export/$viewId/'}
              search={enableDownload}
              params
              {...props} />
          )}
        >
          Export as .png
        </MenuItem>
        <MenuItem
          disabled={isInsideProject}
          renderRoot={(props) => (
            <Link
              to={'/view/$viewId/dot'}
              search
              params
              {...props} />
          )}
        >
          Export as .dot
        </MenuItem>
        <MenuItem
          disabled={isInsideProject}
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
          disabled={isInsideProject}
          renderRoot={(props) => (
            <Link
              to={'/view/$viewId/mmd'}
              search
              params={{
                viewId,
              }}
              {...props} />
          )}>
          Export as .mmd
        </MenuItem>
        <MenuItem
          disabled={isInsideProject}
          renderRoot={(props) => (
            <Link
              to={'/view/$viewId/puml'}
              search
              params={{
                viewId,
              }}
              {...props} />
          )}>
          Export as .puml
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
