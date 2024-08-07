import type { SVGProps } from 'react'

const Open = (props: SVGProps<SVGMarkerElement>) => (
  <marker
    viewBox="-4 -4 14 16"
    refX={5}
    refY={4}
    markerWidth="7"
    markerHeight="8"
    preserveAspectRatio="xMaxYMid meet"
    orient="auto-start-reverse"
    {...props}
  >
    <path
      d="M0,0 L7,4 L0,8 L4,4 Z"
      stroke="context-stroke"
      fill="context-stroke"
      strokeDasharray={0}
      strokeWidth={1}
      strokeLinecap={'round'} />
  </marker>
)

const Arrow = (props: SVGProps<SVGMarkerElement>) => (
  <marker
    viewBox="-1 -1 12 10"
    refX={4}
    refY={3}
    markerWidth="8"
    markerHeight="6"
    preserveAspectRatio="xMaxYMid meet"
    orient="auto-start-reverse"
    {...props}>
    <path
      d="M 0 0 L 8 3 L 0 6 L 1 3 z"
      fill="context-stroke"
      strokeWidth={0}
    />
  </marker>
)

const OArrow = (props: SVGProps<SVGMarkerElement>) => (
  <marker
    viewBox="-1 -1 12 10"
    refX={4}
    refY={3}
    markerWidth="8"
    markerHeight="6"
    preserveAspectRatio="xMaxYMid meet"
    orient="auto-start-reverse"
    {...props}>
    <path
      d="M 0 0 L 8 3 L 0 6 L 1 3 z"
      stroke="context-stroke"
      fill="var(--likec4-background-color)"
      strokeWidth={1.25}
      strokeLinejoin="miter"
      strokeLinecap={'square'}
    />
  </marker>
)

const Diamond = (props: SVGProps<SVGMarkerElement>) => (
  <marker
    viewBox="-4 -4 16 14"
    refX={5}
    refY={4}
    markerWidth="10"
    markerHeight="8"
    preserveAspectRatio="xMaxYMid meet"
    orient="auto-start-reverse"
    {...props}
  >
    <path
      d="M5,0 L10,4 L5,8 L0,4 Z"
      fill="context-stroke"
      strokeWidth={0}
      strokeLinecap={'round'}
    />
  </marker>
)

const ODiamond = (props: SVGProps<SVGMarkerElement>) => (
  <marker
    viewBox="-4 -4 16 14"
    refX={6}
    refY={4}
    markerWidth="10"
    markerHeight="8"
    preserveAspectRatio="xMaxYMid meet"
    orient="auto-start-reverse"
    {...props}>
    <path
      d="M5,0 L10,4 L5,8 L0,4 Z"
      stroke="context-stroke"
      fill="var(--likec4-background-color)"
      strokeWidth={1.25}
      strokeLinecap={'round'}
    />
  </marker>
)

const Dot = (props: SVGProps<SVGMarkerElement>) => (
  <marker
    viewBox="0 0 10 10"
    refX={4}
    refY={4}
    markerWidth="6"
    markerHeight="6"
    {...props}>
    <circle
      strokeWidth={0}
      fill="context-stroke"
      cx={4}
      cy={4}
      r={3}
    />
  </marker>
)

const ODot = (props: SVGProps<SVGMarkerElement>) => (
  <marker
    viewBox="0 0 10 10"
    refX={4}
    refY={4}
    markerWidth="6"
    markerHeight="6"
    {...props}>
    <circle
      strokeWidth={1.25}
      stroke="context-stroke"
      fill="var(--likec4-background-color)"
      cx={4}
      cy={4}
      r={3}
    />
  </marker>
)

export const EdgeMarkers = {
  Arrow,
  OArrow,
  Open,
  Diamond,
  ODiamond,
  Dot,
  ODot
}

export type EdgeMarkerType = keyof typeof EdgeMarkers
