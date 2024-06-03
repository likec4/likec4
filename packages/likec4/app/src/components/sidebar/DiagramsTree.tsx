import { Box, Button, Tree, useComputedColorScheme, useMantineColorScheme, useTree } from '@mantine/core'
import { IconFolderFilled, IconFolderOpen, IconLayoutDashboard } from '@tabler/icons-react'
import { Link, useParams } from '@tanstack/react-router'
import { isTruthy } from 'remeda'
import { useLikeC4View } from '../../data'
import { useDiagramsTreeData } from './data'

export function DiagramsTree() {
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
  // const mantine = useMantineTheme()

  // const router = useRouter()
  // const routerState = useRouterState()
  // const selectedId = viewId && inTree(viewId, data) ? [viewId] : []

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
                  {!hasChildren && <IconLayoutDashboard size={15} opacity={0.7} />}
                  {hasChildren && expanded && <IconFolderOpen size={15} />}
                  {hasChildren && !expanded && <IconFolderFilled size={15} />}
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
}
