// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { useLikeC4Projects } from '@likec4/diagram'
import {
  Button,
  Divider,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  useMantineTheme,
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { IconChevronDown, IconShare } from '@tabler/icons-react'
import {
  Link,
  useMatches,
} from '@tanstack/react-router'
import { AnimatePresence } from 'motion/react'
import { memo, useCallback, useState } from 'react'
import {
  enabledWebappExportFormats,
  isWebappExportFormatEnabled,
} from '../../export-formats'
import { useCurrentProject, useCurrentViewId } from '../../hooks'
import { ColorSchemeToggle } from '../ColorSchemeToggle'
import { NavigationPanel } from './NavigationPanel'
import { SelectProject } from './SelectProject'
import { ShareModal } from './ShareModal'
import { useHeaderVisible } from './state'

export const Header = memo(() => {
  const projects = useLikeC4Projects()
  const isReactDiagramRoute = useMatches({
    select(matches) {
      return matches.some(({ routeId }) =>
        routeId === '/_single/view/$viewId/'
        || routeId === '/project/$projectId/view/$viewId/'
      )
    },
  })
  const { breakpoints } = useMantineTheme()
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.md})`) ?? false
  const [opened, { open, close }] = useDisclosure(false)

  const headerVisible = useHeaderVisible()

  return (
    <>
      <AnimatePresence initial={false}>
        {headerVisible && (
          <NavigationPanel.Root
            panelPosition="right"
            hideBelow={'md'}
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}>
            <NavigationPanel.Body gap={'2'}>
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
                    to={'../'}
                    size={isTablet ? 'sm' : 'xs'}
                    variant="subtle"
                    color="gray">
                    Back to diagram
                  </Button>
                )}

              <Divider orientation="vertical" visibleFrom="md" />
              <ColorSchemeToggle />
            </NavigationPanel.Body>
          </NavigationPanel.Root>
        )}
      </AnimatePresence>
      {headerVisible && opened && <ShareModal onClose={close} />}
    </>
  )
})

const enableDownload = <P extends Record<string, unknown>>(params: P): P & { download: true } => ({
  ...params,
  download: true,
})

const enableJpegDownload = <P extends Record<string, unknown>>(params: P): P & { download: true; format: 'jpeg' } => ({
  ...params,
  download: true,
  format: 'jpeg' as const,
})

function ExportButton() {
  const isInsideProject = useMatches({
    select: matches => matches.some(({ routeId }) => routeId === '/project/$projectId'),
  })
  const [isDrawioLoading, setIsDrawioLoading] = useState(false)
  const project = useCurrentProject()
  const viewId = useCurrentViewId()
  const enabledFormats = enabledWebappExportFormats(project)

  const handleDrawioExport = useCallback(async () => {
    try {
      setIsDrawioLoading(true)
      const { loadDrawioSources } = await import('likec4:drawio')
      const { drawioEditUrl } = await loadDrawioSources(project.id)
      const url = drawioEditUrl(viewId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Failed to export to Draw.io:', error)
    } finally {
      setIsDrawioLoading(false)
    }
  }, [project.id, viewId])

  if (enabledFormats.length === 0) {
    return null
  }

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
        {isWebappExportFormatEnabled(project, 'png') && (
          <MenuItem
            renderRoot={(props) => (
              <Link
                target="_blank"
                to={isInsideProject ? '/project/$projectId/export/$viewId/' : '/export/$viewId/'}
                search={enableDownload}
                {...props} />
            )}
          >
            Export as .png
          </MenuItem>
        )}
        {isWebappExportFormatEnabled(project, 'jpg') && (
          <MenuItem
            renderRoot={(props) => (
              <Link
                target="_blank"
                to={isInsideProject ? '/project/$projectId/export/$viewId/' : '/export/$viewId/'}
                search={enableJpegDownload}
                {...props} />
            )}
          >
            Export as .jpg
          </MenuItem>
        )}
        {isWebappExportFormatEnabled(project, 'dot') && (
          <MenuItem
            renderRoot={(props) => (
              <Link
                to={isInsideProject ? '/project/$projectId/view/$viewId/dot/' : '/view/$viewId/dot/'}
                search
                {...props} />
            )}
          >
            Export as .dot
          </MenuItem>
        )}
        {isWebappExportFormatEnabled(project, 'd2') && (
          <MenuItem
            renderRoot={(props) => (
              <Link
                to={isInsideProject ? '/project/$projectId/view/$viewId/d2' : '/view/$viewId/d2'}
                search
                {...props} />
            )}
          >
            Export as .d2
          </MenuItem>
        )}
        {isWebappExportFormatEnabled(project, 'mmd') && (
          <MenuItem
            renderRoot={(props) => (
              <Link
                to={isInsideProject ? '/project/$projectId/view/$viewId/mmd' : '/view/$viewId/mmd'}
                search
                {...props} />
            )}>
            Export as .mmd
          </MenuItem>
        )}
        {isWebappExportFormatEnabled(project, 'puml') && (
          <MenuItem
            renderRoot={(props) => (
              <Link
                to={isInsideProject ? '/project/$projectId/view/$viewId/puml' : '/view/$viewId/puml'}
                search
                {...props} />
            )}>
            Export as .puml
          </MenuItem>
        )}
        {isWebappExportFormatEnabled(project, 'drawio') && (
          <MenuItem disabled={isDrawioLoading} onClick={handleDrawioExport}>Export to Draw.io</MenuItem>
        )}
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
