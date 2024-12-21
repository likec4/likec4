import { Box } from '@mantine/core'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { type DiagramState, useDiagramState } from '../../../hooks'
import { ElementShapeSvg } from '../../../xyflow/nodes/element/ElementShapeSvg'
import type { SharedFlowTypes } from '../../shared/xyflow/_types'
import * as css from './styles.css'
import * as nodeCss from '../../../xyflow/nodes/Node.css'
import { Text } from '../../../controls/Text'
import { NodeVariants, useFramerAnimateVariants } from '../../../xyflow/nodes/AnimateVariants'
import { ActionButtonBar } from '../../../controls/action-button-bar/ActionButtonBar'
import { BrowseRelationshipsButton, NavigateToButton, OpenSourceButton } from '../../../controls/action-buttons/ActionButtons'

type ElementNodeProps = NodeProps<SharedFlowTypes.ElementNode>

function selector(s: DiagramState) {
  return {
    currentViewId: s.view.id,
    enableRelationshipBrowser: s.enableRelationshipBrowser,
    onOpenSource: s.onOpenSource
  }
}

export function ElementNode({
  data: {
    fqn,
    element,
    ports,
    navigateTo,
    dimmed
  },
  width = 100,
  height = 100
}: ElementNodeProps) {
  const {
    currentViewId,
    onOpenSource,
    enableRelationshipBrowser
  } = useDiagramState(selector)

  const nodeVariants = NodeVariants(width, height)
  const [, animateHandlers] = useFramerAnimateVariants()

  return (
    <>
      <m.div
        className={clsx([
          css.elementNode,
          'likec4-element-node'
        ])}
        data-likec4-color={element.color}
        data-likec4-shape={element.shape}

        initial={false}
        variants={nodeVariants}
        animate={dimmed ? "dimmed" : "idle"}
        whileHover="hovered"
        whileTap="tap"
        {...animateHandlers}
      >
        <svg
          className={clsx(
            css.cssShapeSvg
          )}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
        >
          <ElementShapeSvg shape={element.shape} w={width} h={height} />
        </svg>
        <Box className={css.elementNodeContent}>
          <Text className={css.elementNodeTitle} lineClamp={2}>{element.title}</Text>
          {element.description && (
            <Text className={css.elementNodeDescription} lineClamp={4}>{element.description}</Text>
          )}
        </Box>
        <Box className={clsx(nodeCss.bottomBtnContainer)}>
          <ActionButtonBar shiftY='bottom' {...animateHandlers}>
            {navigateTo && navigateTo !== currentViewId && (
              <NavigateToButton viewId={navigateTo} />
            )}
            {enableRelationshipBrowser && (
              <BrowseRelationshipsButton fqn={fqn} />
            )}
            {onOpenSource && (
              <OpenSourceButton fqn={fqn} />
            )}
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
            top: `${15 + (i + 1) * ((height - 30) / (ports.out.length + 1))}px`
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
            top: `${15 + (i + 1) * ((height - 30) / (ports.in.length + 1))}px`
          }} />
      ))}
    </>
  )
}
