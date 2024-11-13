import { delay } from '@likec4/core'
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
    layoutId = id,
    leaving = false,
    initialAnimation = true,
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

  let opacity = 1
  if (data.dimmed) {
    opacity = data.dimmed === 'immediate' ? 0.05 : 0.15
  }
  if (leaving) {
    opacity = 0
  }

  return (
    <>
      <m.div
        className={clsx([
          css.compoundNodeBody,
          'likec4-compound-node'
        ])}
        layoutId={layoutId}
        data-compound-depth={3}
        data-likec4-color={element.color}
        initial={(layoutId === id && initialAnimation)
          ? {
            ...scale(-20),
            opacity: 0,
            width,
            height
          }
          : false}
        animate={{
          ...scale(0),
          opacity,
          width,
          height,
          transition: {
            opacity: {
              delay: !leaving && data.dimmed === true ? .4 : 0,
              ...((leaving || data.dimmed === 'immediate') && {
                duration: 0.09
              })
            }
          }
        }}
        {...(selectable && {
          whileHover: {
            ...scale(12),
            scaleX: (width + 12) / width,
            scaleY: (height + 12) / height,
            transition: {
              delay: 0.1
            }
          },
          whileTap: {
            ...scale(-12)
          }
        })}
      >
        <Text className={css.compoundNodeTitle} maw={width - 20}>
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
