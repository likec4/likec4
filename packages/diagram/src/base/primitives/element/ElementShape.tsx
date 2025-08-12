import { nonexhaustive } from '@likec4/core'
import type { ElementShape, ElementStyle } from '@likec4/core/types'
import { Box } from '@likec4/styles/jsx'
import { elementShapeRecipe } from '@likec4/styles/recipes'
import { roundDpr } from '../../../utils'

export function cylinderSVGPath(diameter: number, height: number, tilt = 0.065) {
  const radius = Math.round(diameter / 2)
  // const tiltAdjustedHeight = height * Math.cos((tilt * Math.PI) / 2)
  const rx = radius
  const ry = roundDpr(tilt * radius)
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
    rx,
  }
}

function queueSVGPath(width: number, height: number, tilt = 0.185) {
  const diameter = height
  const radius = Math.round(diameter / 2)
  const ry = radius
  const rx = roundDpr((diameter / 2) * tilt)
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
    rx,
  }
}

const PersonIcon = {
  width: 115,
  height: 120,
  path:
    `M57.9197 0C10.9124 0 33.5766 54.75 33.5766 54.75C38.6131 62.25 45.3285 60.75 45.3285 66C45.3285 70.5 39.4526 72 33.5766 72.75C24.3431 72.75 15.9489 71.25 7.55474 84.75C2.51825 93 0 120 0 120H115C115 120 112.482 93 108.285 84.75C99.8905 70.5 91.4963 72.75 82.2628 72C76.3869 71.25 70.5109 69.75 70.5109 65.25C70.5109 60.75 77.2263 62.25 82.2628 54C82.2628 54.75 104.927 0 57.9197 0V0Z`,
} as const

type ElementShapeProps = {
  shape: ElementShape
  w: number
  h: number
}

function ShapeSvg({ shape, w, h }: ElementShapeProps) {
  switch (shape) {
    case 'mobile': {
      return (
        <>
          <rect
            width={w}
            height={h}
            rx={6}
            data-likec4-fill="mix-stroke"
            strokeWidth={0}
          />
          <g data-likec4-fill="fill" strokeWidth={0}>
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
            data-likec4-fill="mix-stroke"
            strokeWidth={0}
          />
          <g data-likec4-fill="fill" strokeWidth={0}>
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
            strokeWidth={0} />
          <svg
            x={w - PersonIcon.width - 6}
            y={h - PersonIcon.height}
            width={PersonIcon.width}
            height={PersonIcon.height}
            viewBox={`0 0 ${PersonIcon.width} ${PersonIcon.height}`}
            data-likec4-fill="mix-stroke"
          >
            <path
              strokeWidth={0}
              d={PersonIcon.path} />
          </svg>
        </>
      )
    }
    case 'queue': {
      const { path, rx, ry } = queueSVGPath(w, h)
      return (
        <>
          <path d={path} strokeWidth={2} />
          <ellipse cx={rx} cy={ry} ry={ry - 0.75} rx={rx} data-likec4-fill="mix-stroke" strokeWidth={2} />
        </>
      )
    }
    case 'storage':
    case 'cylinder': {
      const { path, rx, ry } = cylinderSVGPath(w, h)
      return (
        <>
          <path d={path} strokeWidth={2} />
          <ellipse cx={rx} cy={ry} ry={ry} rx={rx - 0.75} data-likec4-fill="mix-stroke" strokeWidth={2} />
        </>
      )
    }
    case 'rectangle': {
      return (
        <rect
          width={w}
          height={h}
          rx={6}
          strokeWidth={0} />
      )
    }
    default: {
      return nonexhaustive(shape)
    }
  }
}

function ShapeHtml({ multiple, withOutLine }: { multiple: boolean; withOutLine: boolean }) {
  return (
    <Box
      className={elementShapeRecipe({
        shapetype: 'html',
      })}
    >
      {multiple && <div className={'likec4-shape-multiple'} />}
      {withOutLine && <div className={'likec4-shape-outline'} />}
    </Box>
  )
}

type Data = {
  shape: ElementShape
  width: number
  height: number
  style?: ElementStyle
}

// type ElementShapePrimitiveProps = NodeProps<Data> & {
type ElementShapePrimitiveProps = {
  data: Data
  width?: number
  height?: number
  // isMultiple?: boolean | undefined
  /**
   * @default true
   */
  withSelectedIndicator?: boolean | undefined
}

export function ElementShape(
  { data, width, height, withSelectedIndicator = true }: ElementShapePrimitiveProps,
) {
  let w = !!width && width > 10 ? width : data.width
  let h = !!height && height > 10 ? height : data.height
  const isMultiple = data.style?.multiple ?? false

  if (data.shape === 'rectangle') {
    return <ShapeHtml multiple={isMultiple} withOutLine={withSelectedIndicator} />
  }

  const className = elementShapeRecipe({
    shapetype: 'svg',
  })

  return (
    <>
      {isMultiple && (
        <svg className={className} data-likec4-shape-multiple="true" viewBox={`0 0 ${w} ${h}`}>
          <ShapeSvg shape={data.shape} w={w} h={h} />
        </svg>
      )}
      <svg className={className} viewBox={`0 0 ${w} ${h}`}>
        {withSelectedIndicator && <SelectedIndicator shape={data.shape} w={w} h={h} />}
        <ShapeSvg shape={data.shape} w={w} h={h} />
      </svg>
    </>
  )
}

/**
 * When element is selected, this component is used to render the indicator
 */
export function SelectedIndicator({ shape, w, h }: ElementShapeProps) {
  let svg
  switch (shape) {
    case 'queue':
      svg = <path d={queueSVGPath(w, h).path} />
      break
    case 'storage':
    case 'cylinder': {
      svg = <path d={cylinderSVGPath(w, h).path} />
      break
    }
    default: {
      svg = (
        <rect
          x={-1}
          y={-1}
          width={w + 2}
          height={h + 2}
          rx={6} />
      )
      break
    }
  }
  return <g className={'likec4-shape-outline'}>{svg}</g>
}
