import { Box, Text as MantineText } from '@mantine/core'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual } from 'fast-equals'
import { m } from 'framer-motion'
import { memo } from 'react'
import { type DiagramState, useDiagramState } from '../../../hooks'
import { ElementShapeSvg } from '../../../xyflow/nodes/element/ElementShapeSvg'
import type { XYFlowTypes } from '../_types'
import * as css from '../../shared/xyflow/ElementNode.css'
import * as nodeCss from '../../../xyflow/nodes/Node.css'
import { BrowseRelationshipsButton, NavigateToButton, OpenSourceButton } from '../../../xyflow/ActionButton/ActionButtons'
import { ActionButtonBar } from '../../../xyflow/ActionButtonBar/ActionButtonBar'

const Text = MantineText.withProps({
  component: 'div'
})

type ElementNodeProps = NodeProps<XYFlowTypes.ElementNode>

function selector(s: DiagramState) {
  return {
    currentViewId: s.view.id,
    onOpenSource: s.onOpenSource
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
    entering = true,
    ...data
  },
  selectable = true,
  width: w = 100,
  height: h = 100
}) => {
  const {
    currentViewId,
    onOpenSource
  } = useDiagramState(selector)

  const maxWH = Math.max(w, h)
  const scale = (diff: number) => {
    const s = (maxWH + diff) / maxWH
    return ({
      scaleX: s,
      scaleY: s
    })
  }

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
        initial={(layoutId === id && entering)
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
        <Box className={clsx(nodeCss.bottomBtnContainer)}>
          <ActionButtonBar
            keyPrefix={`${currentViewId}:element:${id}:`}
            shiftY='bottom'
            >
            {navigateTo && navigateTo !== currentViewId && (<NavigateToButton fqn={data.fqn}/>)}
            {data.column !== 'subjects' && (<BrowseRelationshipsButton fqn={data.fqn} />)}
            {onOpenSource && (<OpenSourceButton fqn={data.fqn} />)}
          </ActionButtonBar>
        </Box>
      </m.div>
      {ports.in.map((id, i) => (
        <Handle
          key={id}
          id={id}
          type="target"
          position={Position.Left}
          style={{
            visibility: 'hidden',
            top: `${15 + (i + 1) * ((h - 30) / (ports.in.length + 1))}px`
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
            top: `${15 + (i + 1) * ((h - 30) / (ports.out.length + 1))}px`
          }} />
      ))}
    </>
  )
}, (prev, next) => {
  return deepEqual(prev.data, next.data)
})
