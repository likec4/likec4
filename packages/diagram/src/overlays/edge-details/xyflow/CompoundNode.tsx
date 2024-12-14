import { Text as MantineText } from '@mantine/core'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { m } from 'framer-motion'
import type { SharedTypes } from '../../shared/xyflow/_types'
import * as css from '../../shared/xyflow/CompoundNode.css'

const Text = MantineText.withProps({
  component: 'div'
})

type CompoundNodeProps = NodeProps<SharedTypes.CompoundNode>

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
        data-compound-depth={3}
        data-likec4-color={element.color}
        animate={{
          opacity: data.dimmed ? 0.15 : 1,
          transition: {
            delay: data.dimmed === true ? .4 : 0
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
      {ports.out.map((id, i) => (
        <Handle
          key={id}
          id={id}
          type={'source'}
          position={Position.Right}
          style={{
            visibility: 'hidden',
            top: `${16 + 20 * i}px`
          }} />
      ))}
      {ports.in.map((id, i) => (
        <Handle
          key={id}
          id={id}
          type={'target'}
          position={Position.Left}
          style={{
            visibility: 'hidden',
            top: `${16 + 20 * i}px`
          }} />
      ))}
    </>
  )
}
