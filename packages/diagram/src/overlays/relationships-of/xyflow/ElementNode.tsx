import { ActionIcon, Box, Text as MantineText } from '@mantine/core'
import { IconZoomScan } from '@tabler/icons-react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { useOverlayDialog } from '../../../components'
import { type DiagramState, useDiagramState } from '../../../hooks'
import { ElementShapeSvg } from '../../../xyflow/nodes/element/ElementShapeSvg'
import { stopPropagation } from '../../../xyflow/utils'
import type { XYFlowTypes } from '../_types'
import * as css from './styles.css'

const Text = MantineText.withProps({
  component: 'div'
})

type ElementNodeProps = NodeProps<XYFlowTypes.ElementNode>

function selector(s: DiagramState) {
  return {
    viewId: s.view.id,
    onNavigateTo: s.onNavigateTo
  }
}

export function ElementNode({
  data: {
    element,
    ports,
    navigateTo,
    ...data
  },
  selectable = true,
  width: w = 100,
  height: h = 100
}: ElementNodeProps) {
  const overlay = useOverlayDialog()
  const {
    viewId,
    onNavigateTo
  } = useDiagramState(selector)
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
        animate={{
          opacity: data.dimmed ? 0.15 : 1,
          transition: {
            delay: data.dimmed ? .8 : 0
          }
        }}
        {...(selectable && {
          whileHover: {
            scale: 1.045,
            transition: {
              delay: 0.15
            }
          },
          whileTap: {
            scale: 0.97
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
          <Text className={css.elementNodeTitle} lineClamp={2}>{element.title}</Text>
          {element.description && (
            <Text className={css.elementNodeDescription} lineClamp={4}>{element.description}</Text>
          )}
        </Box>
        {navigateTo && onNavigateTo && navigateTo !== viewId && (
          <Box className={css.navigateBtnBox}>
            <ActionIcon
              className={clsx('nodrag nopan', css.navigateBtn)}
              radius="md"
              onClick={(event) => {
                event.stopPropagation()
                setTimeout(() => onNavigateTo(navigateTo), 200)
                overlay.close()
              }}
              role="button"
              onDoubleClick={stopPropagation}
              onPointerDownCapture={stopPropagation}
            >
              <IconZoomScan stroke={1.8} style={{ width: '75%' }} />
            </ActionIcon>
          </Box>
        )}
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
