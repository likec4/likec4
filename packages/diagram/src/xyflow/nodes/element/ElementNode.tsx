import { Text } from '@mantine/core'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual } from 'fast-equals'
import { motion, type Variants } from 'framer-motion'
import { memo } from 'react-tracked'
import useTilg from 'tilg'
import { useDiagramState, useDiagramStateSelector } from '../../../state'
import type { ElementNodeData } from '../../types'
import { toDomPrecision } from '../../utils'
import { NavigateToBtn } from '../shared/NavigateToBtn'
import * as css from './element.css'
import classes from './element.module.css'
import { ElementIcon } from './ElementIcon'
import { ElementLink } from './ElementLink'
import { ElementShapeSvg, SelectedIndicator } from './ElementShapeSvg'

type ElementNodeProps = NodeProps<ElementNodeData>

const isEqualProps = (prev: ElementNodeProps, next: ElementNodeProps) => (
  prev.id === next.id
  && prev.width === next.width
  && prev.height === next.height
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

export const ElementNodeMemo = memo<ElementNodeProps>(function ElementNode({
  id,
  data: {
    element
  },
  width,
  height
}) {
  useTilg()
  const diagramState = useDiagramState()
  const isHovercards = diagramState.disableHovercards !== true
  const isNavigable = diagramState.hasOnNavigateTo && !!element.navigateTo
  const isHovered = useDiagramStateSelector(state => state.hoveredNodeId === id)

  const w = toDomPrecision(width ?? element.width)
  const h = toDomPrecision(height ?? element.height)

  return (
    <motion.div
      id={id}
      className={clsx(classes.container, css.container)}
      data-likec4-color={element.color}
      data-likec4-shape={element.shape}
      variants={variants}
      initial={'idle'}
      whileTap={'tap'}
      animate={isHovered ? 'hover' : 'idle'}
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
        className={classes.shapeSvg}
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
      <div className={css.element}>
        {element.icon && <ElementIcon node={element} />}
        <Text component="div" className={css.title}>
          {element.title}
        </Text>
        {element.technology && (
          <Text component="div" className={css.technology}>
            {element.technology}
          </Text>
        )}
        {element.description && (
          <Text
            component="div"
            className={css.description}
          >
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
      {isHovercards && <ElementLink element={element} />}
      {isNavigable && <NavigateToBtn xynodeId={id} className={classes.navigateBtn} />}
    </motion.div>
  )
}, isEqualProps)
