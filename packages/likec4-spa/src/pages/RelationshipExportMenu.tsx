// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import {
  type RelationshipBrowserActionProps,
  useLikeC4Model,
} from '@likec4/diagram'
import {
  ActionIcon,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  Tooltip,
} from '@mantine/core'
import { IconDownload } from '@tabler/icons-react'
import { Link, useMatches } from '@tanstack/react-router'
import { useState } from 'react'
import {
  enabledWebappExportFormats,
  isImageExportFormatEnabled,
  isWebappExportFormatEnabled,
} from '../export-formats'
import { useCurrentProject } from '../hooks'
import { generateRelationshipDrawioEditUrl } from '../relationship-export'

export function RelationshipExportMenu({
  subjectId,
  viewId,
  scope,
}: RelationshipBrowserActionProps) {
  const project = useCurrentProject()
  const model = useLikeC4Model()
  const [isDrawioLoading, setIsDrawioLoading] = useState(false)
  const enabledFormats = enabledWebappExportFormats(project)
  const isInsideProject = useMatches({
    select: matches => matches.some(({ routeId }) => routeId === '/project/$projectId'),
  })

  if (enabledFormats.length === 0) {
    return null
  }

  const addRelationshipSearch = <P extends Record<string, unknown>>(params: P) => ({
    ...params,
    relationships: subjectId,
    relationshipScope: scope,
  })
  const addRelationshipDownload = <P extends Record<string, unknown>>(params: P) => ({
    ...addRelationshipSearch(params),
    download: true,
  })
  const addRelationshipJpegDownload = <P extends Record<string, unknown>>(params: P) => ({
    ...addRelationshipDownload(params),
    format: 'jpeg' as const,
  })

  const handleDrawioExport = async () => {
    const popup = window.open('', '_blank')
    if (!popup) {
      return
    }
    popup.opener = null
    try {
      setIsDrawioLoading(true)
      const url = await generateRelationshipDrawioEditUrl({
        model,
        baseViewId: viewId as never,
        subjectId: subjectId as never,
        scope,
      })
      popup.location.href = url
    } catch (error) {
      popup.close()
      console.error('Failed to export relationship view to Draw.io:', error)
    } finally {
      setIsDrawioLoading(false)
    }
  }

  return (
    <Menu shadow="md" width={190} trigger="click-hover" openDelay={200} withinPortal={false}>
      <MenuTarget>
        <Tooltip label="Export relationship view" color="dark" fz="xs" openDelay={400} withinPortal={false}>
          <ActionIcon
            variant="default"
            color="gray"
            aria-label="Export relationship view">
            <IconDownload />
          </ActionIcon>
        </Tooltip>
      </MenuTarget>
      <MenuDropdown>
        <MenuLabel>Relationship view</MenuLabel>
        {isImageExportFormatEnabled(project, 'png') && (
          <MenuItem
            renderRoot={props => (
              <Link
                target="_blank"
                to={isInsideProject ? '/project/$projectId/export/$viewId/' : '/export/$viewId/'}
                search={addRelationshipDownload}
                {...props} />
            )}>
            Export as .png
          </MenuItem>
        )}
        {isImageExportFormatEnabled(project, 'jpeg') && (
          <MenuItem
            renderRoot={props => (
              <Link
                target="_blank"
                to={isInsideProject ? '/project/$projectId/export/$viewId/' : '/export/$viewId/'}
                search={addRelationshipJpegDownload}
                {...props} />
            )}>
            Export as .jpg
          </MenuItem>
        )}
        {isWebappExportFormatEnabled(project, 'dot') && (
          <MenuItem
            renderRoot={props => (
              <Link
                to={isInsideProject ? '/project/$projectId/view/$viewId/dot/' : '/view/$viewId/dot/'}
                search={addRelationshipSearch}
                {...props} />
            )}>
            Export as .dot
          </MenuItem>
        )}
        {isWebappExportFormatEnabled(project, 'd2') && (
          <MenuItem
            renderRoot={props => (
              <Link
                to={isInsideProject ? '/project/$projectId/view/$viewId/d2/' : '/view/$viewId/d2/'}
                search={addRelationshipSearch}
                {...props} />
            )}>
            Export as .d2
          </MenuItem>
        )}
        {isWebappExportFormatEnabled(project, 'mmd') && (
          <MenuItem
            renderRoot={props => (
              <Link
                to={isInsideProject ? '/project/$projectId/view/$viewId/mmd/' : '/view/$viewId/mmd/'}
                search={addRelationshipSearch}
                {...props} />
            )}>
            Export as .mmd
          </MenuItem>
        )}
        {isWebappExportFormatEnabled(project, 'puml') && (
          <MenuItem
            renderRoot={props => (
              <Link
                to={isInsideProject ? '/project/$projectId/view/$viewId/puml/' : '/view/$viewId/puml/'}
                search={addRelationshipSearch}
                {...props} />
            )}>
            Export as .puml
          </MenuItem>
        )}
        {isWebappExportFormatEnabled(project, 'drawio') && (
          <MenuItem disabled={isDrawioLoading} onClick={handleDrawioExport}>Export to Draw.io</MenuItem>
        )}
      </MenuDropdown>
    </Menu>
  )
}
