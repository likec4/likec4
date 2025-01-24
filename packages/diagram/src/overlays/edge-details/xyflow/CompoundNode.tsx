import { type NodeProps, Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { Text } from '../../../controls/Text'
import { ElementIcon } from '../../../xyflow/nodes/shared/ElementIcon'
import type { SharedFlowTypes } from '../../shared/xyflow/_types'
import * as css from './styles.css'
import { useDiagramState } from '../../../hooks'
import { Box } from '@mantine/core'

type CompoundNodeProps = NodeProps<SharedFlowTypes.CompoundNode>

export function CompoundNode({
  id,
  data: {
    element,
    ports,
    ...data
  },
  width = 200,
  selectable = true,
}: CompoundNodeProps) {
  const { currentViewId, renderIcon } = useDiagramState(s => ({
    currentViewId: s.view.id,
    renderIcon: s.renderIcon,
  }))

  const elementIcon = ElementIcon({
    element: { id, ...element },
    viewId: currentViewId,
    className: css.elementIcon,
    renderIcon: renderIcon,
  })

  return (
    <>
      <m.div
        className={clsx([
          css.compoundNodeBody,
          'likec4-compound-node',
        ])}
        data-compound-depth={3}
        data-likec4-color={element.color}
        animate={{
          opacity: data.dimmed ? 0.15 : 1,
          transition: {
            delay: data.dimmed === true ? .4 : 0,
          },
        }}
        {...(selectable && {
          whileHover: {
            scale: 1.04,
            transition: {
              delay: 0.15,
            },
          },
          whileTap: {
            scale: 1,
          },
        })}
      >
        <Box className={css.compoundNodeTitle}>
          {elementIcon}
          <Text className={css.compoundNodeTitleText} maw={width - 20}>
            {element.title}
          </Text>
        </Box>
      </m.div>
      {ports.out.map((id, i) => (
        <Handle
          key={id}
          id={id}
          type={'source'}
          position={Position.Right}
          style={{
            visibility: 'hidden',
            top: `${16 + 20 * i}px`,
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
            top: `${16 + 20 * i}px`,
          }} />
      ))}
    </>
  )
}
