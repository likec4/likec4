import { Text } from '@mantine/core'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { DEV } from 'esm-env'
import { deepEqual as eq } from 'fast-equals'
import { m, type Variants } from 'framer-motion'
import { memo } from 'react'
import { isNumber } from 'remeda'
import useTilg from 'tilg'
import { useDiagramState } from '../../../state'
import type { ElementXYFlowNode } from '../../types'
import { toDomPrecision } from '../../utils'
import { NavigateToBtn } from '../shared/NavigateToBtn'
import * as css from './element.css'
import { ElementIcon } from './ElementIcon'
import { ElementLink } from './ElementLink'
import { ElementShapeSvg, SelectedIndicator } from './ElementShapeSvg'

type ElementNodeProps = NodeProps<ElementXYFlowNode>

const selectedScale = 1.015
// Frame-motion variants
const variants = {
  idle: (_, { scale }) => ({
    scale: 1,
    transition: {
      delay: isNumber(scale) && scale > selectedScale ? 0.09 : 0
    }
  }),
  selected: (_, { scale }) => ({
    scale: selectedScale,
    transition: {
      delay: isNumber(scale) && scale > selectedScale ? 0.09 : 0
    }
  }),
  // dimmed: {
  //   filter: 'brightness(0.5)',
  //   transition: {
  //     duration: 0.8,
  //     ease: 'easeInOut',
  //   }
  // },
  // dragging: {
  //   scale: selectedScale
  // },
  // hovered: {
  //   scale: 1.08
  // },
  // hover: (_, {scale}) => isNumber(scale) && scale < 1.02 ? ({
  //   scale: 1.08,
  // }) : ({
  //   scale: 1.08,
  //   transition: {
  //     delay: 1
  //   }
  // }),
  hovered: {
    scale: 1.06
  },
  tap: {
    scale: 0.975
  }
  // tap: {
  //   scale: 0.9
  // }
} satisfies Variants

const isEqualProps = (prev: ElementNodeProps, next: ElementNodeProps) => (
  prev.id === next.id
  && eq(prev.selected ?? false, next.selected ?? false)
  && eq(prev.dragging ?? false, next.dragging ?? false)
  && eq(prev.width ?? 0, next.width ?? 0)
  && eq(prev.height ?? 0, next.height ?? 0)
  && eq(prev.data.element, next.data.element)
)

export const ElementNodeMemo = memo<ElementNodeProps>(function ElementNode({
  id,
  data: {
    element
  },
  dragging,
  selected = false,
  width,
  height
}) {
  const { isHovered, isDimmed, hasOnNavigateTo, isHovercards, isInteractive } = useDiagramState(s => ({
    isHovered: s.hoveredNodeId === id,
    isDimmed: s.dimmed.has(id),
    isInteractive: s.nodesDraggable || s.nodesSelectable || !!s.onNavigateTo,
    isHovercards: s.showElementLinks,
    hasOnNavigateTo: !!s.onNavigateTo
  }))
  // const diagramState = useDiagramState()
  // const isNodeInteractive = diagramState.isNodeInteractive
  // const isHovercards = diagramState.disableHovercards !== true
  // const isNavigable = diagramState.hasOnNavigateTo && !!element.navigateTo
  const isNavigable = hasOnNavigateTo && !!element.navigateTo

  const w = toDomPrecision(width ?? element.width)
  const h = toDomPrecision(height ?? element.height)

  let animate: keyof typeof variants = 'idle'
  switch (true) {
    case dragging && selected:
      animate = 'selected'
      break
    case dragging:
      animate = 'idle'
      break
    case isInteractive && isHovered:
      animate = 'hovered'
      break
    case selected:
      animate = 'selected'
      break
  }

  // useTilg(animate, isHovered, isInteractive)

  return (
    <m.div
      id={id}
      className={clsx([
        css.container,
        isDimmed && css.dimmed,
        animate !== 'idle' && css.containerAnimated,
        'likec4-element-node'
      ])}
      data-hovered={!dragging && isHovered}
      data-likec4-color={element.color}
      data-likec4-shape={element.shape}
      variants={variants}
      initial={false}
      animate={animate}
      {...(isInteractive && {
        whileTap: dragging ? animate : 'tap'
      })}
    >
      {
        /* <NodeToolbar
        position={Position.Bottom}
        align={'start'}
        offset={-10}
        isVisible={selected || isHovered}>
<Button>editggg</Button>
      </NodeToolbar> */
      }
      {
        /* <NodeResizer minWidth={100} minHeight={30} />
      <NodeToolbar
        position={Position.Right}
        align={'start'}
        style={{
          background: 'blue'
        }}>
        <Stack>
          <Button>edit</Button>

        </Stack>
      </NodeToolbar>*/
      }
      {
        /* {element.inEdges.map((edge) => (
        <Handle
          key={edge}
          id={edge}
          type="target"
          position={Position.Top}
          style={{ visibility: 'hidden' }}
        />
      ))} */
      }
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: 'hidden' }}
      />
      <svg
        className={clsx(
          css.cssShapeSvg
        )}
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
      >
        <g className={css.indicator}>
          <SelectedIndicator
            shape={element.shape}
            w={w}
            h={h}
          />
        </g>
        <ElementShapeSvg
          shape={element.shape}
          w={w}
          h={h}
        />
      </svg>
      <div className={clsx(css.element, 'likec4-element')}>
        <ElementIcon node={element} />
        <Text
          component="div"
          className={clsx(css.title, 'likec4-element-title')}>
          {element.title}
        </Text>
        {element.technology && (
          <Text
            component="div"
            className={clsx(css.technology, 'likec4-element-technology')}>
            {element.technology}
          </Text>
        )}
        {element.description && (
          <Text
            component="div"
            className={clsx(css.description, 'likec4-element-description')}>
            {element.description}
          </Text>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: 'hidden' }}
      />
      {
        /* {element.outEdges.map((edge) => (
        <Handle
        key={edge}
          id={edge}
          type="source"
          position={Position.Bottom}
          style={{ visibility: 'hidden' }}
        />
      ))} */
      }
      {isHovercards && element.links && <ElementLink element={element} />}
      {isNavigable && <NavigateToBtn xynodeId={id} className={css.cssNavigateBtn} />}
    </m.div>
  )
}, isEqualProps)
