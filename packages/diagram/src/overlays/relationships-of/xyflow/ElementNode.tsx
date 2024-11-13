import { ActionIcon, Box, Group, Text as MantineText } from '@mantine/core'
import { IconFileSymlink, IconTransform, IconZoomScan } from '@tabler/icons-react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual } from 'fast-equals'
import { m } from 'framer-motion'
import { memo } from 'react'
import { type DiagramState, useDiagramState } from '../../../hooks'
import { ElementShapeSvg } from '../../../xyflow/nodes/element/ElementShapeSvg'
import { stopPropagation } from '../../../xyflow/utils'
import { useOverlayDialog } from '../../OverlayContext'
import type { XYFlowTypes } from '../_types'
import * as css from './styles.css'

const Action = ActionIcon.withProps({
  className: 'nodrag nopan ' + css.navigateBtn,
  radius: 'md',
  role: 'button',
  onDoubleClick: stopPropagation,
  onPointerDownCapture: stopPropagation
})

const Text = MantineText.withProps({
  component: 'div'
})

type ElementNodeProps = NodeProps<XYFlowTypes.ElementNode>

function selector(s: DiagramState) {
  return {
    currentViewId: s.view.id,
    onNavigateTo: s.onNavigateTo,
    onOpenSource: s.onOpenSourceElement
  }
}

export const ElementNode = memo<ElementNodeProps>(({
  id,
  data: {
    element,
    ports,
    navigateTo,
    layoutId = id,
    leaving = false,
    initialAnimation = true,
    ...data
  },
  selectable = true,
  width: w = 100,
  height: h = 100
}) => {
  const overlay = useOverlayDialog()
  const {
    currentViewId,
    onNavigateTo,
    onOpenSource
  } = useDiagramState(selector)

  const scale = (diff: number) => ({
    scaleX: (w + diff) / w,
    scaleY: (h + diff) / h
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
          css.elementNode,
          'likec4-element-node'
        ])}
        layoutId={layoutId}
        data-likec4-color={element.color}
        initial={(layoutId === id && initialAnimation)
          ? {
            ...scale(-20),
            opacity: 0,
            width: w,
            height: h
          }
          : false}
        animate={{
          ...scale(0),
          opacity,
          width: w,
          height: h,
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
            ...scale(16)
            // transition: {
            //   delay: 0.1
            // }
          },
          whileTap: {
            ...scale(-8)
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
          <ElementShapeSvg shape={element.shape} w={w} h={h} />
        </svg>
        <Box className={css.elementNodeContent}>
          <Text className={css.elementNodeTitle} lineClamp={2}>
            {element.title}
          </Text>
          {element.description && (
            <Text className={css.elementNodeDescription} lineClamp={4}>{element.description}</Text>
          )}
        </Box>
        <Group className={css.navigateBtnBox}>
          {navigateTo && onNavigateTo && navigateTo !== currentViewId && (
            <Action
              onClick={(event) => {
                event.stopPropagation()
                overlay.close(() => onNavigateTo(navigateTo))
              }}>
              <IconZoomScan stroke={1.8} style={{ width: '75%' }} />
            </Action>
          )}
          {data.column !== 'subjects' && (
            <Action
              onClick={(event) => {
                event.stopPropagation()
                overlay.openOverlay({
                  relationshipsOf: data.fqn
                })
              }}>
              <IconTransform stroke={1.8} style={{ width: '72%' }} />
            </Action>
          )}
          {onOpenSource && (
            <Action
              onClick={(event) => {
                event.stopPropagation()
                onOpenSource(data.fqn)
              }}>
              <IconFileSymlink stroke={1.8} style={{ width: '72%' }} />
            </Action>
          )}
        </Group>
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
}, (prev, next) => {
  return deepEqual(prev.data, next.data)
})
