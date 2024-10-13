import { Box, Text as MantineText } from '@mantine/core'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { ElementShapeSvg } from '../../../xyflow/nodes/element/ElementShapeSvg'
import type { XYFlowTypes } from '../_types'
import * as css from './styles.css'

const Text = MantineText.withProps({
  component: 'div'
})

type ElementNodeProps = NodeProps<XYFlowTypes.ElementNode>

export function ElementNode({
  data: {
    element,
    ports
  },
  selectable = true,
  width: w = 100,
  height: h = 100
}: ElementNodeProps) {
  // const xyflow = useReactFlow()
  // const sortedports.right = pipe(
  //   ports.right,
  //   map(port => {
  //     const node = xyflow.getInternalNode(port.id)!
  //     node?.internals.positionAbsolute
  //     return {
  //       ...port,
  //       positionY: node.internals.positionAbsolute.y + ((node.height ?? 0) / 2)
  //     }
  //   }),
  //   sortBy(prop('positionY'))
  // )
  return (
    <>
      <m.div
        className={clsx([
          css.elementNode,
          'likec4-element-node'
        ])}
        data-likec4-color={element.color}
        {...(selectable && {
          whileHover: {
            scale: 1.05
          },
          whileTap: {
            scale: 0.985
          }
        })}
      >
        <svg
          className={clsx(
            css.cssShapeSvg
          )}
          viewBox={`0 0 ${w} ${h}`}
          width={w}
          height={h}
        >
          <ElementShapeSvg
            shape={element.shape}
            w={w}
            h={h} />
        </svg>
        <Box className={css.elementNodeContent}>
          <Text className={css.elementNodeTitle}>{element.title}</Text>
          {element.description && <Text className={css.elementNodeDescription}>{element.description}</Text>}
        </Box>
      </m.div>
      {ports.left.map(({ id, type }, i) => (
        <Handle
          key={id}
          id={id}
          type={type === 'in' ? 'target' : 'source'}
          position={Position.Left}
          style={{
            visibility: 'hidden',
            top: `${15 + (i + 1) * ((h - 30) / (ports.left.length + 1))}px`
          }} />
      ))}
      {ports.right.map(({ id, type }, i) => (
        <Handle
          key={id}
          id={id}
          type={type === 'in' ? 'target' : 'source'}
          position={Position.Right}
          style={{
            visibility: 'hidden',
            top: `${15 + (i + 1) * ((h - 30) / (ports.right.length + 1))}px`
          }} />
      ))}
    </>
  )
}
