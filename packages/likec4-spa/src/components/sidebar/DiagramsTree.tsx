// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { DiagramView } from '@likec4/core/types'
import { StaticLikeC4Diagram, useUpdateEffect } from '@likec4/diagram'
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
import { type PropsWithChildren, memo, useEffect } from 'react'
import { useCurrentView, useLikeC4Views } from '../../hooks'
import { type GroupBy, isTreeNodeData, useDiagramsTreeData } from './data'
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

const setHoveredNode = () => {}

export const DiagramsTree = /* @__PURE__ */ memo(({ groupBy }: {
  groupBy: GroupBy | undefined
}) => {
  const views = useLikeC4Views()
  const data = useDiagramsTreeData(groupBy)
  const navigate = useNavigate()
  const navigateTo = (viewId: string) => {
    SidebarDrawerOps.close()
    void navigate({
      to: '/view/$viewId/',
      viewTransition: false,
      params: { viewId },
    })
  }
  const [diagram] = useCurrentView()
  const viewId = diagram?.id ?? null

  const tree = useTree({
    multiple: false,
  })
  tree.setHoveredNode = setHoveredNode

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
        data={data}
        styles={{
          node: {
            marginTop: 2,
            marginBottom: 2,
          },
        }}
        levelOffset={'md'}
        renderNode={({ node, selected, expanded, elementProps, hasChildren }) => (
          <DiagramPreviewHoverCard diagram={!hasChildren ? views.find((v) => v.id === node.value) : undefined}>
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

function DiagramPreviewHoverCard({ diagram, children }: PropsWithChildren<{ diagram: DiagramView | undefined }>) {
  const ratio = diagram ? Math.max(diagram.bounds.width / 400, diagram.bounds.height / 300) : 1

  const width = diagram ? Math.round(diagram.bounds.width / ratio) : 0
  const height = diagram ? Math.round(diagram.bounds.height / ratio) : 0

  return (
    <>
      {diagram && (
        <HoverCard position="right-start" openDelay={400} closeDelay={100} keepMounted={false} shadow="lg">
          <HoverCardTarget>
            {children}
          </HoverCardTarget>
          <HoverCardDropdown style={{ width, height }} p={'xs'}>
            <DiagramPreview diagram={diagram} />
          </HoverCardDropdown>
        </HoverCard>
      )}
      {!diagram && children}
    </>
  )
}

const DiagramPreview = memo<{
  diagram: DiagramView
}>(({ diagram }) => {
  const ratio = Math.max(diagram.bounds.width / 400, diagram.bounds.height / 300)

  const width = Math.round(diagram.bounds.width / ratio)
  const height = Math.round(diagram.bounds.height / ratio)

  return (
    <StaticLikeC4Diagram
      view={diagram}
      fitView
      fitViewPadding={'4px'}
      enableElementDetails={false}
      reduceGraphics
      initialWidth={width}
      initialHeight={height}
    />
  )
}, (prev, next) => prev.diagram.id === next.diagram.id)
