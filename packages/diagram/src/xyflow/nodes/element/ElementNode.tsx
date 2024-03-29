import { Text } from '@mantine/core'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { deepEqual } from 'fast-equals'
import { motion, type Variants } from 'framer-motion'
import { memo } from 'react-tracked'
import { useDiagramState, useDiagramStateSelector } from '../../../state'
import type { ElementXYFlowNode } from '../../types'
import { toDomPrecision } from '../../utils'
import { NavigateToBtn } from '../shared/NavigateToBtn'
import {
  container,
  cssElement,
  cssNavigateBtn,
  cssShapeSvg,
  description as cssdescription,
  indicator,
  technology as csstechnology,
  title as cssTitle
} from './element.css'
import { ElementIcon } from './ElementIcon'
import { ElementLink } from './ElementLink'
import { ElementShapeSvg, SelectedIndicator } from './ElementShapeSvg'

type ElementNodeProps = NodeProps<ElementXYFlowNode>

const isEqualProps = (prev: ElementNodeProps, next: ElementNodeProps) => (
  prev.id === next.id
  && prev.width === next.width
  && prev.height === next.height
  && prev.selected === next.selected
  && deepEqual(prev.data, next.data)
  // && isEqualSimple(prev.data, next.data)
)

// Frame-motion variants
const variants = {
  idle: {
    transformOrigin: '50% 50%'
  },
  hover: {
    scale: 1.07,
    transition: {
      delay: 0.15
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      type: 'spring'
    }
  }
} satisfies Variants

export const ElementNodeMemo = /* @__PURE__ */ memo<ElementNodeProps>(function ElementNode({
  id,
  data: {
    element
  },
  selected = false,
  width,
  height
}) {
  // useTilg()
  const diagramState = useDiagramState()
  const isNodeInteractive = diagramState.isNodeInteractive
  const isHovercards = diagramState.disableHovercards !== true
  const isNavigable = diagramState.hasOnNavigateTo && !!element.navigateTo
  const isHovered = useDiagramStateSelector(state => state.hoveredNodeId === id)

  const w = toDomPrecision(width ?? element.width)
  const h = toDomPrecision(height ?? element.height)

  return (
    <motion.div
      id={id}
      className={container}
      data-likec4-color={element.color}
      data-likec4-shape={element.shape}
      variants={variants}
      initial={'idle'}
      {...(isNodeInteractive && {
        whileTap: 'tap',
        animate: isHovered || selected ? 'hover' : 'idle',
        ['data-likec4-interactive']: true
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
        // @ts-expect-error
        type="target"
        position={Position.Top}
        style={{ visibility: 'hidden' }}
      />
      <svg
        className={cssShapeSvg}
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
      >
        <g className={indicator}>
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
      <div className={cssElement}>
        {element.icon && <ElementIcon node={element} />}
        <Text component="div" className={cssTitle}>
          {element.title}
        </Text>
        {element.technology && (
          <Text component="div" className={csstechnology}>
            {element.technology}
          </Text>
        )}
        {element.description && (
          <Text
            component="div"
            className={cssdescription}
          >
            {element.description}
          </Text>
        )}
      </div>
      <Handle
        // @ts-expect-error
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
      {isHovercards && <ElementLink element={element} />}
      {isNavigable && <NavigateToBtn xynodeId={id} className={cssNavigateBtn} />}
    </motion.div>
  )
}, isEqualProps)
