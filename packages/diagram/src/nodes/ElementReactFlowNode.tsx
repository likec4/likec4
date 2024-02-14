import { nonexhaustive } from '@likec4/core'
import { Button, Image, Stack, Text } from '@mantine/core'
import { isEqualReactSimple, isEqualSimple } from '@react-hookz/deep-equal'
import { Handle, type NodeProps, NodeResizer, NodeToolbar, Position } from '@xyflow/react'
import { motion, type Variant, type Variants } from 'framer-motion'
import { memo } from 'react'
import type { ElementNodeData } from '../types'
import { toDomPrecision } from '../utils'
import { useLikeC4Editor, useLikeC4EditorTriggers } from '../ViewEditorApi'
import classes from './ElementReactFlowNode.module.css'
import { NavigateToBtn } from './shared/NavigateToBtn'

type ElementReactFlowNodeProps = Pick<
  NodeProps<ElementNodeData>,
  'id' | 'data' | 'width' | 'height' | 'selected' | 'dragging'
>
const isEqualProps = (prev: ElementReactFlowNodeProps, next: ElementReactFlowNodeProps) => (
  prev.id === next.id
  && prev.selected === next.selected
  && prev.dragging === next.dragging
  && prev.width === next.width
  && prev.height === next.height
  && isEqualSimple(prev.data, next.data)
)

function cylinderSVGPath(diameter: number, height: number, tilt = 0.0725) {
  const radius = Math.round(diameter / 2)
  // const tiltAdjustedHeight = height * Math.cos((tilt * Math.PI) / 2)
  const rx = radius
  const ry = Math.round(tilt * radius)
  const tiltAdjustedHeight = height - 2 * ry

  const path = `  M ${diameter},${ry}
        a ${rx},${ry} 0,0,0 ${-diameter} 0
        l 0,${tiltAdjustedHeight}
        a ${rx},${ry} 0,0,0 ${diameter} 0
        l 0,${-tiltAdjustedHeight}
        z
        `
    .replace(/\s+/g, ' ')
    .trim()
  return {
    path,
    ry,
    rx
  }
}

function queueSVGPath(width: number, height: number, tilt = 0.2) {
  const diameter = height
  const radius = Math.round(diameter / 2)
  const ry = radius
  const rx = Math.round((diameter / 2) * tilt)
  const tiltAdjustedWidth = width - 2 * rx

  const path = `
    M ${rx},0
    a ${rx},${ry} 0,0,0 0 ${diameter}
    l ${tiltAdjustedWidth},0
    a ${rx},${ry} 0,0,0 0 ${-diameter}
    z`
    .replace(/\s+/g, ' ')
    .trim()
  return {
    path,
    ry,
    rx
  }
}

const PersonIcon = {
  width: 115,
  height: 120,
  path:
    `M57.9197 0C10.9124 0 33.5766 54.75 33.5766 54.75C38.6131 62.25 45.3285 60.75 45.3285 66C45.3285 70.5 39.4526 72 33.5766 72.75C24.3431 72.75 15.9489 71.25 7.55474 84.75C2.51825 93 0 120 0 120H115C115 120 112.482 93 108.285 84.75C99.8905 70.5 91.4963 72.75 82.2628 72C76.3869 71.25 70.5109 69.75 70.5109 65.25C70.5109 60.75 77.2263 62.25 82.2628 54C82.2628 54.75 104.927 0 57.9197 0V0Z`
} as const

export function ElementCanvasSvgDefs() {
  return (
    <filter id="elementShadow">
      {
        /* <feDropShadow dx="2" dy="12" stdDeviation="10" floodColor={'rgb(0 0 0 / 0.02)'} />
      <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor={'rgb(0 0 0 / 0.05)'} /> */
      }
      {/* <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor={'rgb(0 0 0 / 0.1)'} /> */}
    </filter>
  )
}

type ElementSvgProps = {
  shape: ElementNodeData['shape']
  w: number
  h: number
}

const ElementSvg = memo<ElementSvgProps>(function ElementSvg({
  shape,
  w,
  h
}) {
  switch (shape) {
    case 'mobile': {
      return (
        <>
          <rect
            width={w}
            height={h}
            rx={6}
            className={classes.fillMixStroke}
            strokeWidth={0}
          />
          <g className={classes.fillElementFill} strokeWidth={0}>
            <circle cx={17} cy={h / 2} r={12} />
            <rect x={33} y={12} width={w - 44} height={h - 24} rx={5} />
          </g>
        </>
      )
    }
    case 'browser': {
      return (
        <>
          <rect
            width={w}
            height={h}
            rx={6}
            className={classes.fillMixStroke}
            strokeWidth={0}
          />
          <g className={classes.fillElementFill} strokeWidth={0}>
            <circle cx={16} cy={17} r={7} />
            <circle cx={36} cy={17} r={7} />
            <circle cx={56} cy={17} r={7} />
            <rect x={70} y={8} width={w - 80} height={17} rx={4} />
            <rect x={10} y={32} width={w - 20} height={h - 42} rx={4} />
          </g>
        </>
      )
    }
    case 'person': {
      return (
        <>
          <rect
            width={w}
            height={h}
            rx={6}
            strokeWidth={0}
          />
          <svg
            x={w - PersonIcon.width - 6}
            y={h - PersonIcon.height}
            width={PersonIcon.width}
            height={PersonIcon.height}
            viewBox={`0 0 ${PersonIcon.width} ${PersonIcon.height}`}
            className={classes.fillMixStroke}
          >
            <path
              strokeWidth={0}
              d="M57.9197 0C10.9124 0 33.5766 54.75 33.5766 54.75C38.6131 62.25 45.3285 60.75 45.3285 66C45.3285 70.5 39.4526 72 33.5766 72.75C24.3431 72.75 15.9489 71.25 7.55474 84.75C2.51825 93 0 120 0 120H115C115 120 112.482 93 108.285 84.75C99.8905 70.5 91.4963 72.75 82.2628 72C76.3869 71.25 70.5109 69.75 70.5109 65.25C70.5109 60.75 77.2263 62.25 82.2628 54C82.2628 54.75 104.927 0 57.9197 0V0Z"
            />
          </svg>
        </>
      )
    }
    case 'queue': {
      const { path, rx, ry } = queueSVGPath(w, h)
      return (
        <>
          <path d={path} strokeWidth={2} />
          <ellipse cx={rx} cy={ry} ry={ry - 0.75} rx={rx} className={classes.fillMixStroke} strokeWidth={2} />
        </>
      )
    }
    case 'storage':
    case 'cylinder': {
      const { path, rx, ry } = cylinderSVGPath(w, h)
      return (
        <>
          <path d={path} strokeWidth={2} />
          <ellipse cx={rx} cy={ry} ry={ry} rx={rx - 0.75} className={classes.fillMixStroke} strokeWidth={2} />
        </>
      )
    }
    case 'rectangle': {
      return (
        <rect
          width={w}
          height={h}
          rx={6}
          strokeWidth={0}
        />
      )
    }
    default: {
      return nonexhaustive(shape)
    }
  }
}, isEqualReactSimple)

const ElementIndicatorSvg = memo<ElementSvgProps>(function ElementIndicatorSvg({
  shape,
  w,
  h
}) {
  switch (shape) {
    case 'queue': {
      const { path } = queueSVGPath(w, h)
      return <path d={path} />
    }
    case 'storage':
    case 'cylinder': {
      const { path } = cylinderSVGPath(w, h)
      return <path d={path} />
    }
    default: {
      return (
        <rect
          x={-1}
          y={-1}
          width={w + 2}
          height={h + 2}
          rx={6}
        />
      )
    }
  }
}, isEqualReactSimple)

// Frame-motion variants
const variants = {
  idle: {
    transformOrigin: '50% 50%'
  },
  hover: {
    scale: 1.06,
    transition: {
      when: 'beforeChildren',
      delay: 0.1
    }
  },
  dragging: {
    scale: 1.02,
    transition: {
      type: 'spring'
    }
  }
} satisfies Variants

export const ElementReactFlowNode = memo<ElementReactFlowNodeProps>(function ElementNode(props) {
  const {
    id,
    data: element,
    dragging,
    width,
    height
  } = props
  const editor = useLikeC4Editor()
  const trigger = useLikeC4EditorTriggers()

  const isNavigatable = editor.hasOnNavigateTo && !!element.navigateTo

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
      whileTap={'dragging'}
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
          <ElementIndicatorSvg
            shape={element.shape}
            w={w}
            h={h}
          />
        </g>
        <ElementSvg
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
      {isNavigatable && (
        <NavigateToBtn
          onClick={() => {
            trigger.onNavigateTo(props)
          }}
          className={classes.navigateBtn} />
      )}
    </motion.div>
  )
}, isEqualProps)
