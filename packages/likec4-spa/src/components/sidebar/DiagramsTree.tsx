// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { pickViewBounds, StaticLikeC4Diagram, useUpdateEffect } from '@likec4/diagram'
import { Box } from '@likec4/styles/jsx'
import {
  type TreeNodeData,
  Button,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  ThemeIcon,
  Tree,
  useComputedColorScheme,
  useTree,
} from '@mantine/core'
import {
  IconFileCode,
  IconFolderFilled,
  IconFolderOpen,
  IconLayoutDashboard,
  IconStack2,
  IconStarFilled,
} from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { type PropsWithChildren, memo, useEffect, useMemo } from 'react'
import { useLikeC4ProjectContext } from '../../context/safeCtx'
import { useCurrentProject, useModelDiffs, useOptionalCurrentView } from '../../hooks'
import { useModelDiffState } from '../model-diff/state'
import { type GroupBy, isTreeNodeData, useDiagramsTree } from './data'
import { SidebarDrawerOps } from './state'

const isFile = (node: TreeNodeData) => isTreeNodeData(node) && node.type === 'file'

const FolderIcon = ({ node, expanded }: { node: TreeNodeData; expanded: boolean }) => {
  if (isFile(node)) {
    return (
      <ThemeIcon size={'sm'} variant="transparent" color="indigo">
        <IconFileCode size={16} />
      </ThemeIcon>
    )
  }
  return (
    <ThemeIcon size={'sm'} variant="transparent" color="violet">
      {expanded ? <IconFolderOpen size={16} /> : <IconFolderFilled size={16} />}
    </ThemeIcon>
  )
}

export const DiagramsTree = /* @__PURE__ */ memo(({ groupBy }: {
  groupBy: GroupBy | undefined
}) => {
  const { tree: data, viewIds } = useDiagramsTree(groupBy)
  const knownViews = useMemo(() => new Set(viewIds), [viewIds])
  const { diffs } = useModelDiffs()
  const { diffId } = useModelDiffState()
  const introduced = useMemo(() => {
    const summary = diffs.find(diff => diff.id === diffId)
    return (summary?.views ?? []).filter(view => !knownViews.has(view.id))
  }, [diffs, diffId, knownViews])
  const treeData = useMemo(() => {
    if (introduced.length === 0) {
      return data
    }
    return [
      ...data,
      {
        value: '@diff-views',
        label: 'In this diff',
        type: 'folder' as const,
        children: introduced.map(view => ({
          value: view.id,
          label: view.title ?? view.id,
          type: 'view' as const,
        })),
      },
    ]
  }, [data, introduced])
  const navigate = useNavigate()
  const { id: projectId } = useCurrentProject()
  const navigateTo = (viewId: string) => {
    SidebarDrawerOps.close()
    void navigate({
      to: '/project/$projectId/view/$viewId/',
      viewTransition: false,
      params: { projectId, viewId },
      search: (prev) => ({
        ...prev,
        ...(diffId ? { diff: diffId } : {}),
      }),
    })
  }
  const diagram = useOptionalCurrentView()
  const viewId = diagram?.id ?? null

  const tree = useTree({
    multiple: false,
  })

  const sourcePath = diagram?.sourcePath ?? null

  useUpdateEffect(() => {
    tree.collapseAllNodes()
  }, [groupBy])

  useEffect(() => {
    if (sourcePath) {
      const segments = sourcePath.split('/')
      let path = '@fs'
      for (const segment of segments) {
        path += `/${segment}`
        tree.expand(path)
      }
    }
  }, [sourcePath, groupBy])

  useEffect(() => {
    if (viewId) {
      tree.select(viewId)
    }
  }, [viewId])

  const theme = useComputedColorScheme()

  return (
    <Box>
      <Tree
        allowRangeSelection={false}
        tree={tree}
        data={treeData}
        styles={{
          node: {
            marginTop: 2,
            marginBottom: 2,
          },
        }}
        levelOffset={'md'}
        renderNode={({ node, selected, expanded, elementProps, hasChildren }) => (
          <DiagramPreviewHoverCard viewId={!hasChildren && knownViews.has(node.value) ? node.value : undefined}>
            <Button
              fullWidth
              color={theme === 'light' ? 'dark' : 'gray'}
              // color={theme === 'light' ? 'dark' : 'gray'}
              variant={selected ? 'transparent' : 'subtle'}
              size="sm"
              fz={'sm'}
              fw={hasChildren ? '600' : '500'}
              justify="flex-start"
              styles={{
                section: {
                  opacity: 0.5,
                },
              }}
              leftSection={
                <>
                  {!hasChildren && node.value === 'index' && <IconStarFilled size={14} opacity={0.7} />}
                  {!hasChildren && node.value !== 'index' && isTreeNodeData(node) && (
                    <>
                      {node.type === 'deployment-view' && <IconStack2 size={14} />}
                      {node.type === 'view' && <IconLayoutDashboard size={14} />}
                    </>
                  )}
                  {hasChildren && <FolderIcon node={node} expanded={expanded} />}
                </>
              }
              {...elementProps}
              {...(!hasChildren && {
                onClick: (e) => {
                  e.stopPropagation()
                  navigateTo(node.value)
                },
              })}
            >
              {node.label}
            </Button>
          </DiagramPreviewHoverCard>
        )}
      />
    </Box>
  )
}, (prev, next) => prev.groupBy === next.groupBy)

function DiagramPreviewHoverCard({ viewId, children }: PropsWithChildren<{ viewId: string | undefined }>) {
  if (!viewId) {
    return <>{children}</>
  }
  return (
    <HoverCard position="right-start" openDelay={400} closeDelay={100} keepMounted={false} shadow="lg">
      <HoverCardTarget>
        {children}
      </HoverCardTarget>
      <HoverCardDropdown p={'xs'}>
        <DiagramPreview viewId={viewId} />
      </HoverCardDropdown>
    </HoverCard>
  )
}

/**
 * Takes the view from the model when the preview opens: the tree keeps only the ids
 */
const DiagramPreview = memo<{
  viewId: string
}>(({ viewId }) => {
  const { $model } = useLikeC4ProjectContext()
  const diagram = useMemo(() => $model.get().findView(viewId)?.$layouted ?? null, [$model, viewId])
  if (!diagram) {
    return null
  }
  // Sequence views are laid out differently, use the bounds of the variant that is rendered
  const bounds = pickViewBounds(diagram)
  const ratio = Math.max(bounds.width / 400, bounds.height / 300)

  const width = Math.round(bounds.width / ratio)
  const height = Math.round(bounds.height / ratio)

  return (
    <Box style={{ width, height }}>
      <StaticLikeC4Diagram
        view={diagram}
        fitView
        fitViewPadding={'4px'}
        enableElementDetails={false}
        reduceGraphics
        initialWidth={width}
        initialHeight={height}
      />
    </Box>
  )
})
