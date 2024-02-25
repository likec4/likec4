import { Image, Text } from '@mantine/core'
import { isEqualSimple } from '@react-hookz/deep-equal'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { motion, type Variants } from 'framer-motion'
import { memo } from 'react'
import { equals } from 'remeda'
import { useDiagramState, useLikeC4ViewTriggers } from '../../../state'
import { toDomPrecision } from '../../../utils'
import type { ElementNodeData } from '../../types'
import { NavigateToBtn } from '../shared/NavigateToBtn'
import classes from './element.module.css'
import { ElementShapeSvg, SelectedIndicator } from './ElementShapeSvg'

type ElementNodeProps = NodeProps<ElementNodeData>

const isEqualProps = (prev: ElementNodeProps, next: ElementNodeProps) => (
  isEqualSimple(prev, next)
  // prev.id === next.id
  // && prev.selected === next.selected
  // && prev.dragging === next.dragging
  // && prev.width === next.width
  // && prev.height === next.height
  // && isEqualSimple(prev.data, next.data)
)

// Frame-motion variants
const variants = {
  idle: {
    transformOrigin: '50% 50%'
  },
  hover: {
    scale: 1.0655,
    transition: {
      delay: 0.25
    }
  },
  tap: {
    scale: 0.985,
    transition: {
      type: 'spring'
    }
  }
} satisfies Variants

export const ElementNode = memo<ElementNodeProps>(function ElementNodeInner({
  id,
  data: {
    element
  },
  dragging,
  width,
  height
}) {
  const editor = useDiagramState()
  const trigger = useLikeC4ViewTriggers()

  const isNavigable = editor.hasOnNavigateTo && !!element.navigateTo

  const w = toDomPrecision(width ?? element.width)
  const h = toDomPrecision(height ?? element.height)

  return (
    <motion.div
      id={id}
      className={classes.container}
      data-likec4-color={element.color}
      data-likec4-shape={element.shape}
      variants={variants}
      initial={'idle'}
      whileTap={'tap'}
      whileHover={'hover'}
    >
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
      </NodeToolbar>
      </NodeToolbar> */
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
        <g className={classes.indicator}>
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
      <Handle
        type="source"
        id={element.id}
        position={Position.Bottom}
        style={{ visibility: 'hidden' }}
      />
      <div
        className={classes.element}>
        {element.icon && (
          <div className={classes.elementIcon}>
            <Image
              fit="contain"
              src={element.icon}
              alt={element.title} />
          </div>
        )}
        <Text component="div" className={classes.title}>
          {element.title}
        </Text>
        {element.technology && (
          <Text component="div" className={classes.technology}>
            {element.technology}
          </Text>
        )}
        {element.description && (
          <Text
            component="div"
            className={classes.description}
          >
            {element.description}
          </Text>
        )}
      </div>
      {isNavigable && (
        <NavigateToBtn
          onClick={(e) => {
            trigger.onNavigateTo(element, e)
          }}
          className={classes.navigateBtn} />
      )}
    </motion.div>
  )
}, isEqualProps)
