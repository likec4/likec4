import type { LikeC4Model } from '@likec4/core'
import { Alert, Anchor, Box, Pill, Text, Tree, useTree } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import { type ReactNode, useEffect, useMemo } from 'react'
import * as css from './TabPanelStructure.css'

interface ElementTreeNodeData {
  label: ReactNode
  value: string
  element: LikeC4Model.ElementModel
  type: 'ancestor' | 'current' | 'descedant'
  children: TreeNodeData[]
}

interface MessageNodeData {
  label: ReactNode
  value: string
  type: 'message'
  children: TreeNodeData[]
}

type TreeNodeData = ElementTreeNodeData | MessageNodeData

type TabElementStructureProps = {
  element: LikeC4Model.ElementModel
}

const ElementLabel = ({
  element
}: { element: LikeC4Model.ElementModel; type: 'ancestor' | 'current' | 'descedant' }) => (
  <Box className={css.elementLabel}>
    <Text component="div" fz={'sm'} fw={'500'}>{element.title}</Text>
  </Box>
)

// const Render = ({
//   node
// }: RenderTreeNodePayload) => {
// }

export function TabElementStructure({
  element
}: TabElementStructureProps) {
  const tree = useTree({
    multiple: false
  })

  const data = useMemo(() => {
    let seq = 1

    const messageNode = (label: ReactNode): MessageNodeData => ({
      label,
      value: `msg${seq++}`,
      type: 'message',
      children: []
    })

    const current: TreeNodeData = {
      label: <ElementLabel type="current" element={element} />,
      value: element.id,
      element,
      type: 'current',
      children: element.children().map((child): TreeNodeData => ({
        label: <ElementLabel type="descedant" element={child} />,
        value: child.id,
        element: child,
        type: 'descedant',
        children: []
      }))
    }
    if (current.children.length === 0) {
      current.children.push(
        messageNode(<Pill radius={'sm'}>no nested</Pill>)
      )
    }
    let ancestor = element.ancestors().reduce((acc, parent) => ({
      label: <ElementLabel type="ancestor" element={parent} />,
      value: parent.id,
      element: parent,
      type: 'ancestor' as const,
      children: [acc]
    }), current)

    return [
      ancestor
    ]
  }, [element])

  useEffect(() => {
    tree.expandAllNodes()
  }, [data])

  return (
    <>
      <Alert variant="light" color="orange" title="In development" icon={<IconInfoCircle />}>
        We need your feedback. Share your thoughts and ideas -{' '}
        <Anchor
          fz="sm"
          fw={500}
          underline="hover"
          c={'orange'}
          href="https://github.com/likec4/likec4/discussions/"
          target="_blank">
          GitHub discussions
        </Anchor>
      </Alert>
      <Tree
        levelOffset={'xl'}
        allowRangeSelection={false}
        expandOnClick={false}
        expandOnSpace={false}
        classNames={{
          label: css.treeNodeLabel
        }}
        data={data}
        tree={tree}
      />
    </>
  )
}
