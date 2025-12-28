import { cx as clsx } from '@likec4/styles/css'
import { Box, HStack, VStack } from '@likec4/styles/jsx'
import { Paper, Text } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { type NodeToolbarProps, NodeToolbar } from '@xyflow/react'
import type { ReactNode } from 'react'
import type { BaseNodeProps } from '../../../../base/types'
import { type DiagramContext, useDiagramContext } from '../../../../hooks/useDiagram'
import { stopPropagation } from '../../../../utils/xyflow'
import * as styles from './styles.css'

export type ToolbarProps = Omit<NodeToolbarProps, 'title'> & {
  nodeProps: BaseNodeProps
  title: ReactNode
}

const selectSelectedNodesCount = (context: DiagramContext): number => {
  return context.xynodes.filter(x => x.selected).length
}
const useSelectedNodesCount = () => {
  return useDiagramContext(selectSelectedNodesCount)
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
  if (!isToolbarVisible) {
    return null
  }

  return (
    <NodeToolbar
      isVisible={!dragging}
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
        <VStack gap={'2'}>
          <Box px={'1'}>
            <Text className={styles.toolbarTitle}>{title}</Text>
          </Box>
          <HStack gap={'1'}>
            {children}
          </HStack>
        </VStack>
      </Paper>
    </NodeToolbar>
  )
}
