import { Box, Button, ThemeIcon, Tree, type TreeNodeData, useComputedColorScheme, useTree } from '@mantine/core'
import { IconFile, IconFileCode, IconFolderFilled, IconFolderOpen, IconLayoutDashboard } from '@tabler/icons-react'
import { Link, useParams } from '@tanstack/react-router'
import { memo } from 'react'
import { isTruthy } from 'remeda'
import { useLikeC4View } from 'virtual:likec4/store'
import { isTreeNodeData, useDiagramsTreeData } from './data'

const isFile = (node: TreeNodeData) => isTreeNodeData(node) && node.type === 'file'

const FolderIcon = ({ node, expanded }: { node: TreeNodeData; expanded: boolean }) => {
  if (isFile(node)) {
    return (
      <ThemeIcon size={'sm'} variant="transparent" color="indigo">
        <IconFileCode size={16} />
      </ThemeIcon>
    )
  }
  return <ThemeIcon size={'sm'} variant="transparent" color="violet">
    {expanded ? <IconFolderOpen size={16} /> : <IconFolderFilled size={16} />}
  </ThemeIcon>
  // if (expanded) {
  //   return <IconFolderOpen size={16} />
  // }
  // return <IconFolderFilled size={16} />
}

export const DiagramsTree = /* @__PURE__ */ memo(() => {
  const data = useDiagramsTreeData()
  const { viewId } = useParams({
    from: '/view/$viewId'
  })
  const diagram = useLikeC4View(viewId)

  const initialExpandedState = {} as Record<string, boolean>
  if (diagram && isTruthy(diagram.relativePath)) {
    const segments = diagram.relativePath.split('/')
    let path = '@fs'
    for (const segment of segments) {
      path += `/${segment}`
      initialExpandedState[path] = true
    }
  }

  const tree = useTree({
    initialExpandedState,
    multiple: false
  })
  const theme = useComputedColorScheme()

  return (
    <Box>
      <Tree
        tree={tree}
        data={data}
        styles={{
          node: {
            marginTop: 2,
            marginBottom: 2
          }
        }}
        levelOffset={'md'}
        renderNode={({ node, expanded, elementProps, hasChildren }) => (
          <Box {...elementProps}>
            <Button
              fullWidth
              color={theme === 'light' ? 'dark' : 'gray'}
              variant={viewId === node.value ? 'filled' : 'subtle'}
              size="sm"
              fz={'sm'}
              fw={hasChildren ? '600' : '500'}
              justify="flex-start"
              styles={{
                section: {
                  opacity: 0.75
                }
              }}
              leftSection={
                <>
                  {!hasChildren && <IconLayoutDashboard size={16} opacity={0.7} />}
                  {hasChildren && <FolderIcon node={node} expanded={expanded} />}
                </>
              }
              {...(!hasChildren && {
                component: Link,
                params: { viewId: node.value }
              })}
            >
              {node.label}
            </Button>
          </Box>
        )}
      />
    </Box>
  )
})
