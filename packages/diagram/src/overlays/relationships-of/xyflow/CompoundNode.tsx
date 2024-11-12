import { Text as MantineText } from '@mantine/core'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual } from 'fast-equals'
import { m } from 'framer-motion'
import { memo } from 'react'
import type { XYFlowTypes } from '../_types'
import * as css from './styles.css'

const Text = MantineText.withProps({
  component: 'div'
})

type CompoundNodeProps = NodeProps<XYFlowTypes.CompoundNode>

export const CompoundNode = memo<CompoundNodeProps>(({
  id,
  data: {
    element,
    ports,
    skipInitialAnimation = false,
    ...data
  },
  width = 200,
  height = 100,
  selectable = true
}) => {
  const scale = (diff: number) => ({
    scaleX: (width + diff) / width,
    scaleY: (height + diff) / height
  })

  return (
    <>
      <m.div
        className={clsx([
          css.compoundNodeBody,
          'likec4-compound-node'
        ])}
        layoutId={id}
        data-compound-depth={3}
        data-likec4-color={element.color}
        initial={{
          ...scale(-20),
          opacity: 0
        }}
        animate={{
          ...scale(0),
          opacity: data.dimmed ? 0.15 : 1,
          transition: {
            delay: data.dimmed === true ? .4 : 0,
            ...(data.dimmed === 'immediate' && {
              duration: 0
            })
          }
        }}
        {...(selectable && {
          whileHover: {
            scaleX: (width + 12) / width,
            scaleY: (height + 12) / height,
            transition: {
              delay: 0.1
            }
          },
          whileTap: {
            scaleX: (width - 16) / width,
            scaleY: (height - 16) / height
          }
        })}
      >
        <Text component={m.div} layoutId={`${id}:title`} className={css.compoundNodeTitle} maw={width - 20}>
          {element.title}
        </Text>
      </m.div>
      {ports.left.map(({ id, type }, i) => (
        <Handle
          key={id}
          id={id}
          type={type === 'in' ? 'target' : 'source'}
          position={Position.Left}
          style={{
            visibility: 'hidden',
            top: `${20 * (i + 1)}px`
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
            top: `${20 * (i + 1)}px`
          }} />
      ))}
    </>
  )
}, (prev, next) => {
  return deepEqual(prev.data, next.data)
})
