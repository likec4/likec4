import { Box, Group, Paper, Stack, Text } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { type NodeToolbarProps, NodeToolbar } from '@xyflow/react'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { Base } from '../../../../base'
import { useDiagramContext } from '../../../../hooks2/useDiagramContext'
import { stopPropagation } from '../../../../utils/xyflow'
import * as css from './styles.css'

export type ToolbarProps = Omit<NodeToolbarProps, 'title'> & {
  nodeProps: Base.NodeProps
  title: ReactNode
}

const useSelectedNodesCount = () => {
  return useDiagramContext(s => s.xynodes.filter(x => x.selected).length)
}

export function Toolbar({ title, children, nodeProps, ...props }: ToolbarProps) {
  const selectedNodesCount = useSelectedNodesCount()
  const {
    selected = false,
    dragging = false,
    data: {
      hovered = false,
    },
  } = nodeProps

  const _isToolbarVisible = (hovered && selectedNodesCount === 0) || (selected && selectedNodesCount === 1)
  let delay = 150
  if (_isToolbarVisible) {
    // If the node is selected, we want to show the toolbar with minimal delay
    if (selected) {
      delay = 100
    } else {
      // If the node is hovered, we want to show the toolbar with a delay
      delay = 1000
    }
  } else {
    // if there is another node selected, we want to hide the toolbar immediately
    if (selectedNodesCount > 0) {
      delay = 50
    }
  }
  // TODO: This is a workaround to prevent the toolbar from flickering when the node unhovered
  const [isToolbarVisible] = useDebouncedValue(_isToolbarVisible, delay)
  return (
    <NodeToolbar
      isVisible={!dragging && isToolbarVisible}
      offset={4}
      {...props}>
      <Paper
        className={clsx('nodrag', 'nopan')}
        px={5}
        pb={8}
        pt={4}
        radius={'sm'}
        shadow="xl"
        // Prevent event bubbling to XYFlow
        onDoubleClickCapture={stopPropagation}
        onPointerDown={stopPropagation}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        withBorder>
        <Stack gap={6}>
          <Box pl={2}>
            <Text c="dimmed" className={css.toolbarTitle}>{title}</Text>
          </Box>
          <Group gap={4}>
            {children}
          </Group>
        </Stack>
      </Paper>
    </NodeToolbar>
  )
}
