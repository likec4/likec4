import { Text as MantineText } from '@mantine/core'
import { Handle, type NodeProps, Position, useStore } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual, shallowEqual } from 'fast-equals'
import { m } from 'framer-motion'
import { memo, useCallback } from 'react'
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
    entering = true,
    ...data
  },
  width = 200,
  height = 100,
  ...props
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

  const {
    elementsSelectable
  } = useStore(
    useCallback((s) => ({
      elementsSelectable: s.elementsSelectable
    }), []),
    shallowEqual
  )

  const selectable = props.selectable ?? elementsSelectable

  return (
    <>
      <m.div
        className={clsx([
          css.compoundNodeBody,
          'likec4-compound-node'
        ])}
        layoutId={layoutId}
        data-compound-depth={data.depth ?? 1}
        data-likec4-color={element.color}
        initial={(layoutId === id && entering)
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
            transition: {
              delay: 0.1
            }
          },
          whileTap: {
            ...scale(-8)
          }
        })}
      >
        <Text className={css.compoundNodeTitle} maw={width - 20}>
          {element.title}
        </Text>
      </m.div>
      {ports.in.map((id, i) => (
        <Handle
          key={id}
          id={id}
          type="target"
          position={Position.Left}
          style={{
            visibility: 'hidden',
            top: `${20 * (i + 1)}px`
          }} />
      ))}
      {ports.out.map((id, i) => (
        <Handle
          key={id}
          id={id}
          type="source"
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
