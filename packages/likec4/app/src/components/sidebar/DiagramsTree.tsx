import { StaticLikeC4Diagram, useLikeC4Model, useUpdateEffect } from '@likec4/diagram'
import {
  type BoxProps,
  type TreeNodeData,
  Box,
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
import { useRouter } from '@tanstack/react-router'
import { type MouseEvent, type PropsWithChildren, memo, useEffect } from 'react'
import { useCurrentDiagram } from '../../hooks'
import { type GroupBy, isTreeNodeData, useDiagramsTreeData } from './data'

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
  const data = useDiagramsTreeData(groupBy)
  const router = useRouter()
  const diagram = useCurrentDiagram()
  const viewId = diagram?.id ?? null

  const tree = useTree({
    multiple: false,
  })

  const relativePath = diagram?.relativePath ?? null

  useUpdateEffect(() => {
    tree.collapseAllNodes()
  }, [groupBy])

  useEffect(() => {
    if (relativePath) {
      const segments = relativePath.split('/')
      let path = '@fs'
      for (const segment of segments) {
        path += `/${segment}`
        tree.expand(path)
      }
    }
  }, [relativePath, groupBy])

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
          <DiagramPreviewHoverCard viewId={!hasChildren ? node.value : null} {...elementProps}>
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
              {...(!hasChildren && {
                onClick: (e) => {
                  e.stopPropagation()
                  router.commitLocation(
                    router.buildLocation({
                      to: '.',
                      params: (p: any) => ({
                        ...p,
                        viewId: node.value,
                      }),
                    }),
                  )
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
})

function DiagramPreviewHoverCard({
  viewId,
  children,
  ...props
}: PropsWithChildren<BoxProps & { viewId: string | null; onClick: (event: MouseEvent) => void }>) {
  if (!viewId) {
    return <Box {...props}>{children}</Box>
  }
  return (
    <Box {...props}>
      <DiagramPreview viewId={viewId} onClick={props.onClick}>
        {children}
      </DiagramPreview>
    </Box>
  )
}

function DiagramPreview({
  viewId,
  children,
  onClick,
}: PropsWithChildren<{ viewId: string; onClick: (event: MouseEvent) => void }>) {
  const diagramModel = useLikeC4Model('layouted').findView(viewId)

  if (!diagramModel || !diagramModel.isDiagram()) {
    return <>{children}</>
  }
  const diagram = diagramModel.$view

  const ratio = Math.max(diagram.bounds.width / 400, diagram.bounds.height / 300)

  const width = Math.round(diagram.bounds.width / ratio)
  const height = Math.round(diagram.bounds.height / ratio)

  return (
    <HoverCard position="right-start" openDelay={400} closeDelay={100} keepMounted={false} shadow="lg">
      <HoverCardTarget>
        {children}
      </HoverCardTarget>
      <HoverCardDropdown style={{ width, height }} p={'xs'} onClick={onClick}>
        <StaticLikeC4Diagram
          view={diagram}
          fitView
          fitViewPadding={'4px'}
          enableElementDetails={false}
          reduceGraphics
          initialWidth={width}
          initialHeight={height}
        />
      </HoverCardDropdown>
    </HoverCard>
  )
}
