import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { m } from 'framer-motion'
import type { SharedFlowTypes } from '../../shared/xyflow/_types'
import * as css from './styles.css'
import { Text } from '../../../controls/Text'
import { NodeVariants, useFramerAnimateVariants } from '../../../xyflow/nodes/AnimateVariants'

type CompoundNodeProps = NodeProps<SharedFlowTypes.CompoundNode>

export function CompoundNode({
  data: {
    element,
    ports,
    dimmed
  },
  width = 200,
  height = 100
}: CompoundNodeProps) {

  const nodeVariants = NodeVariants(width, height)
  const [, animateHandlers] = useFramerAnimateVariants()

  return (
    <>
      <m.div
        className={clsx([
          css.compoundNodeBody,
          'likec4-compound-node'
        ])}
        data-compound-depth={3}
        data-likec4-color={element.color}

        initial={false}
        variants={nodeVariants}
        animate={dimmed ? "dimmed" : "idle"}
        whileHover = "hover"
        whileTap = "tap"
        {...animateHandlers}
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
