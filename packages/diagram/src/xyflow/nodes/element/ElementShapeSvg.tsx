import { type ElementShape, nonexhaustive } from '@likec4/core'
import { deepEqual as equals } from 'fast-equals'
import { memo } from 'react'
import { fillElementFill, fillMixStroke } from './element.css'

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

type ElementShapeSvgProps = {
  shape: ElementShape
  w: number
  h: number
}

export const ElementShapeSvg = /* @__PURE__ */ memo<ElementShapeSvgProps>(({
  shape,
  w,
  h
}) => {
  switch (shape) {
    case 'mobile': {
      return (
        <>
          <rect
            width={w}
            height={h}
            rx={6}
            className={fillMixStroke}
            strokeWidth={0}
          />
          <g className={fillElementFill} strokeWidth={0}>
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
            className={fillMixStroke}
            strokeWidth={0}
          />
          <g className={fillElementFill} strokeWidth={0}>
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
            className={fillMixStroke}
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
          <ellipse cx={rx} cy={ry} ry={ry - 0.75} rx={rx} className={fillMixStroke} strokeWidth={2} />
        </>
      )
    }
    case 'storage':
    case 'cylinder': {
      const { path, rx, ry } = cylinderSVGPath(w, h)
      return (
        <>
          <path d={path} strokeWidth={2} />
          <ellipse cx={rx} cy={ry} ry={ry} rx={rx - 0.75} className={fillMixStroke} strokeWidth={2} />
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
}, equals)

/**
 * When element is selected, this component is used to render the indicator
 */
export const SelectedIndicator = /* @__PURE__ */ memo<ElementShapeSvgProps>(({
  shape,
  w,
  h
}) => {
  switch (shape) {
    case 'queue':
    case 'storage':
    case 'cylinder': {
      const { path } = shape === 'queue' ? queueSVGPath(w, h) : cylinderSVGPath(w, h)
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
}, equals)
