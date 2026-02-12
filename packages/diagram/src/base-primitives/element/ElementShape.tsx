import { nonexhaustive } from '@likec4/core'
import type { ComputedNodeStyle, ElementShape } from '@likec4/core/types'
import { elementShapeRecipe } from '@likec4/styles/recipes'
import { roundDpr } from '../../utils'

function cylinderSVGPath(diameter: number, height: number, tilt = 0.07) {
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

function docSVGPath(width: number, height: number) {
  const waveHeight = height / 8
  const baseY = roundDpr(height - waveHeight / 2)
  const amplitude = roundDpr(height / 6)
  const radius = 6

  const path = `
    M 0 ${baseY}
    V ${radius}
    Q 0 0 ${radius} 0
    H ${width - radius}
    Q ${width} 0 ${width} ${radius}
    V ${baseY}
    C ${roundDpr(width * 0.75)} ${baseY + amplitude}, ${roundDpr(width * 0.5)} ${baseY - amplitude}, 0 ${baseY}
  `
    .replace(/\s+/g, ' ')
    .trim()

  return {
    path,
  }
}

function bucketSVGPath(width: number, height: number) {
  const cx = width / 2
  const topRx = roundDpr(cx)
  const topRy = roundDpr(Math.min(height / 8, topRx * 0.08))
  const bottomRx = roundDpr(topRx * 0.8)
  const bottomRy = roundDpr(topRy * 1.05)
  const topY = topRy
  const bottomY = height - bottomRy
  const leftBottomX = cx - bottomRx

  const path = `
    M ${width},${topY}
    a ${topRx},${topRy} 0,0,0 ${-width} 0
    L ${leftBottomX},${bottomY}
    a ${bottomRx},${bottomRy} 0,0,0 ${bottomRx * 2} 0
    Z
  `
    .replace(/\s+/g, ' ')
    .trim()

  return {
    path,
    topRx,
    topRy,
    bottomRx,
    bottomRy,
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

const ComponentIcon = {
  width: 60,
  height: 24,
} as const

type ShapeSvgProps = {
  shape: Exclude<ElementShape, 'rectangle'>
  w: number
  h: number
}
function ShapeSvg({ shape, w, h }: ShapeSvgProps) {
  switch (shape) {
    case 'component': {
      const iconX = 6
      const iconY = h / 2 - ComponentIcon.height / 2
      const boxW = 20
      const boxH = 12
      const stubW = 10
      const stubH = 6
      const gap = 2
      return (
        <>
          <rect
            width={w}
            height={h}
            rx={6}
            strokeWidth={0} />
          <rect
            x={-24}
            y={30}
            width={ComponentIcon.width}
            height={ComponentIcon.height}
            rx={4}
            data-likec4-fill="mix-stroke"
            strokeWidth={3} />
          <rect
            x={-24}
            y={30 + ComponentIcon.height + 12}
            width={ComponentIcon.width}
            height={ComponentIcon.height}
            rx={4}
            data-likec4-fill="mix-stroke"
            strokeWidth={3} />
          {
            /* <rect
            x={-24}
            y={30}
            width={ComponentIcon.width}
            height={ComponentIcon.height}
            rx={4}
            data-likec4-fill="mix-stroke"
            strokeWidth={2} />

          <svg
            x={iconX}
            y={iconY}
            width={ComponentIcon.width}
            height={ComponentIcon.height}
            viewBox={`0 0 ${ComponentIcon.width} ${ComponentIcon.height}`}
            data-likec4-fill="mix-stroke"
          >
            <rect x={stubW / 2} y={0} width={boxW} height={boxH} rx={2} strokeWidth={0} />
            <rect x={0} y={boxH / 2 - stubH / 2} width={stubW} height={stubH} rx={1} strokeWidth={0} />
            <rect x={stubW / 2} y={boxH + gap} width={boxW} height={boxH} rx={2} strokeWidth={0} />
            <rect x={0} y={boxH + gap + boxH / 2 - stubH / 2} width={stubW} height={stubH} rx={1} strokeWidth={0} />
            <rect x={stubW / 2} y={2 * (boxH + gap)} width={boxW} height={boxH} rx={2} strokeWidth={0} />
            <rect
              x={0}
              y={2 * (boxH + gap) + boxH / 2 - stubH / 2}
              width={stubW}
              height={stubH}
              rx={1}
              strokeWidth={0} />
          </svg> */
          }
        </>
      )
    }
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
    case 'document': {
      const { path } = docSVGPath(w, h)

      return (
        <path
          d={path}
          data-likec4-fill="fill"
          strokeWidth={2}
        />
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
    case 'bucket': {
      const { path, topRx, topRy } = bucketSVGPath(w, h)
      return (
        <>
          <path d={path} strokeWidth={2} />
          <ellipse
            cx={w / 2}
            cy={topRy}
            rx={topRx}
            ry={topRy}
            data-likec4-fill="mix-stroke"
            strokeWidth={2}
          />
        </>
      )
    }
    case 'storage':
    case 'cylinder': {
      const { path, rx, ry } = cylinderSVGPath(w, h)
      return (
        <>
          <path d={path} strokeWidth={2} />
          <ellipse
            cx={rx}
            cy={ry}
            ry={ry}
            rx={rx - 0.75}
            data-likec4-fill="mix-stroke"
            strokeWidth={2} />
        </>
      )
    }
    default: {
      return nonexhaustive(shape)
    }
  }
}

/**
 * When element is selected, this component is used to render the indicator
 */
function ShapeSvgOutline({ shape, w, h }: ShapeSvgProps) {
  let svg
  switch (shape) {
    case 'bucket':
      svg = (
        <g transform="translate(-3 -3)">
          <path d={bucketSVGPath(w + 6, h + 6).path} />
        </g>
      )
      break
    case 'queue':
      svg = (
        <g transform="translate(-3 -3)">
          <path d={queueSVGPath(w + 6, h + 6).path} />
        </g>
      )
      break
    case 'document':
      svg = (
        <g transform="translate(-3 -3)">
          <path d={docSVGPath(w + 6, h + 6).path} />
        </g>
      )
      break
    case 'storage':
    case 'cylinder': {
      svg = (
        <g transform="translate(-3 -3)">
          <path d={cylinderSVGPath(w + 6, h + 6).path} />
        </g>
      )
      break
    }
    default: {
      svg = (
        <rect
          x={-3}
          y={-3}
          width={w + 6}
          height={h + 6}
          rx={8} />
      )
      break
    }
  }
  return <g className={'likec4-shape-outline'}>{svg}</g>
}
type Data = {
  shape: ElementShape
  width: number
  height: number
  style?: ComputedNodeStyle
}

type ElementShapeProps = {
  data: Data
  width?: number | undefined
  height?: number | undefined
  /**
   * @default true
   */
  showSeletionOutline?: boolean | undefined
}

export function ElementShape(
  { data, width, height, showSeletionOutline = true }: ElementShapeProps,
) {
  let w = !!width && width > 10 ? width : data.width
  let h = !!height && height > 10 ? height : data.height
  const isMultiple = data.style?.multiple ?? false

  const borderStyle = data.style?.border ?? 'none'
  const withBorder = borderStyle !== 'none'

  if (data.shape === 'rectangle') {
    return (
      <div
        style={{
          borderStyle,
        }}
        className={elementShapeRecipe({
          shapetype: 'html',
          withBorder,
        })}>
        {isMultiple && <div className={'likec4-shape-multiple'} />}
        {showSeletionOutline && <div className={'likec4-shape-outline'} />}
      </div>
    )
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
        {showSeletionOutline && <ShapeSvgOutline shape={data.shape} w={w} h={h} />}
        <ShapeSvg shape={data.shape} w={w} h={h} />
      </svg>
    </>
  )
}
