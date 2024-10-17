import { Text as MantineText } from '@mantine/core'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { m } from 'framer-motion'
import type { XYFlowTypes } from '../_types'
import * as css from './styles.css'

const Text = MantineText.withProps({
  component: 'div'
})

type CompoundNodeProps = NodeProps<XYFlowTypes.CompoundNode>

export function CompoundNode({
  data: {
    element,
    ports,
    ...data
  },
  width = 200,
  selectable = true
}: CompoundNodeProps) {
  return (
    <>
      <m.div
        className={clsx([
          css.compoundNodeBody,
          'likec4-compound-node'
        ])}
        data-compound-depth={2}
        data-likec4-color={element.color}
        animate={{
          opacity: data.dimmed ? 0.15 : 1,
          transition: {
            delay: data.dimmed ? .8 : 0
          }
        }}
        {...(selectable && {
          whileHover: {
            scale: 1.04,
            transition: {
              delay: 0.15
            }
          },
          whileTap: {
            scale: 1
          }
        })}
      >
        <Text className={css.compoundNodeTitle} maw={width - 20}>{element.title}</Text>
      </m.div>
      {ports.left.map(({ id, type }, i) => (
        <Handle
          key={id}
          id={id}
          type={type === 'in' ? 'target' : 'source'}
          position={Position.Left}
          style={{
            visibility: 'hidden',
            top: `${16 + 20 * i}px`
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
            top: `${16 + 20 * i}px`
          }} />
      ))}
    </>
  )
}
