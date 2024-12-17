import { Box, Text as MantineText } from '@mantine/core'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { type DiagramState, useDiagramState } from '../../../hooks'
import { ElementShapeSvg } from '../../../xyflow/nodes/element/ElementShapeSvg'
import type { SharedTypes } from '../../shared/xyflow/_types'
import * as css from '../../shared/xyflow/ElementNode.css'
import * as nodeCss from '../../../xyflow/nodes/Node.css'
import { BrowseRelationshipsButton, NavigateToButton, OpenSourceButton } from '../../../xyflow/ActionButton/ActionButtons'
import { ActionButtonBar } from '../../../xyflow/ActionButtonBar/ActionButtonBar'

const Text = MantineText.withProps({
  component: 'div'
})

type ElementNodeProps = NodeProps<SharedTypes.ElementNode>

function selector(s: DiagramState) {
  return {
    currentViewId: s.view.id,
    enableRelationshipBrowser: s.enableRelationshipBrowser,
    onOpenSource: s.onOpenSource
  }
}

export function ElementNode({
  id,
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
  const {
    currentViewId,
    onOpenSource,
    enableRelationshipBrowser
  } = useDiagramState(selector)
  return (
    <>
      <m.div
        className={clsx([
          css.elementNode,
          'likec4-element-node'
        ])}
        data-likec4-color={element.color}
        data-likec4-shape={element.shape}
        animate={{
          opacity: data.dimmed ? 0.15 : 1,
          transition: {
            delay: data.dimmed === true ? .4 : 0
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
          <ElementShapeSvg shape={element.shape} w={w} h={h} />
        </svg>
        <Box className={css.elementNodeContent}>
          <Text className={css.elementNodeTitle} lineClamp={2}>{element.title}</Text>
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
            {enableRelationshipBrowser && (<BrowseRelationshipsButton fqn={data.fqn} />)}
            {onOpenSource && (<OpenSourceButton fqn={data.fqn} />)}
          </ActionButtonBar>
        </Box>
      </m.div>
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
    </>
  )
}
