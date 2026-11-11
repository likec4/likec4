import type { ElementShapeProps } from 'likec4/react'
import { useId, useMemo } from 'react'
import rough from 'roughjs'

type Generator = ReturnType<typeof rough.generator>
type Drawable = ReturnType<Generator['path']>
type PathInfo = ReturnType<Generator['toPaths']>[number]

const FILL = 'var(--likec4-palette-fill)'
const STROKE = 'var(--likec4-palette-stroke)'

/**
 * Distance from the bounds of the node, leaves room for wobbly lines
 */
const INSET = 4

type Box = { x0: number; y0: number; x1: number; y1: number; w: number; h: number }

type Silhouette = {
  /**
   * Outline of the shape, filled and stroked
   */
  body: string
  /**
   * Decorations drawn on top of the body
   */
  details?: (gen: Generator, box: Box) => Drawable[]
}

function roundRect({ x0, y0, w, h }: Box, radius = 8): string {
  const arc = `a${radius},${radius} 0 0 1`
  return [
    `M${x0 + radius},${y0}`,
    `h${w - radius * 2}`,
    `${arc} ${radius},${radius}`,
    `v${h - radius * 2}`,
    `${arc} -${radius},${radius}`,
    `h-${w - radius * 2}`,
    `${arc} -${radius},-${radius}`,
    `v-${h - radius * 2}`,
    `${arc} ${radius},-${radius}`,
    'z',
  ].join(' ')
}

function silhouette(shape: string, box: Box): Silhouette {
  const { x0, y0, x1, y1, w, h } = box
  switch (shape) {
    case 'storage':
    case 'cylinder': {
      const rx = w / 2
      const ry = Math.round(rx * 0.07)
      const top = y0 + ry
      const bottom = y1 - ry
      return {
        body: `M${x1},${top} A${rx},${ry} 0 0 0 ${x0},${top} L${x0},${bottom} A${rx},${ry} 0 0 0 ${x1},${bottom} Z`,
        details: gen => [gen.path(`M${x0},${top} A${rx},${ry} 0 0 0 ${x1},${top}`)],
      }
    }
    case 'bucket': {
      const rx = w / 2
      const ry = Math.round(Math.min(h / 8, rx * 0.08))
      const top = y0 + ry
      const bottom = y1 - ry
      const cx = x0 + rx
      const bottomRx = rx * 0.8
      return {
        body: `M${x1},${top} A${rx},${ry} 0 0 0 ${x0},${top} L${cx - bottomRx},${bottom} A${bottomRx},${ry} 0 0 0 ${
          cx + bottomRx
        },${bottom} Z`,
        details: gen => [gen.path(`M${x0},${top} A${rx},${ry} 0 0 0 ${x1},${top}`)],
      }
    }
    case 'queue': {
      const ry = h / 2
      const rx = Math.round(ry * 0.185)
      const left = x0 + rx
      const right = x1 - rx
      return {
        body: `M${left},${y0} A${rx},${ry} 0 0 0 ${left},${y1} L${right},${y1} A${rx},${ry} 0 0 0 ${right},${y0} Z`,
        details: gen => [gen.path(`M${left},${y0} A${rx},${ry} 0 0 1 ${left},${y1}`)],
      }
    }
    case 'document': {
      const radius = 8
      const baseY = y1 - h / 10
      const amplitude = h / 6
      return {
        body: [
          `M${x0},${baseY}`,
          `V${y0 + radius}`,
          `Q${x0},${y0} ${x0 + radius},${y0}`,
          `H${x1 - radius}`,
          `Q${x1},${y0} ${x1},${y0 + radius}`,
          `V${baseY}`,
          `C${x0 + w * 0.75},${baseY + amplitude} ${x0 + w * 0.5},${baseY - amplitude} ${x0},${baseY}`,
          'Z',
        ].join(' '),
      }
    }
    case 'browser': {
      return {
        body: roundRect(box),
        details: gen => [
          gen.line(x0 + 3, y0 + 26, x1 - 3, y0 + 26),
          ...[0, 1, 2].map(i => gen.circle(x0 + 15 + i * 16, y0 + 13, 8)),
        ],
      }
    }
    case 'mobile': {
      return {
        body: roundRect(box),
        details: gen => [
          gen.line(x0 + 28, y0 + 5, x0 + 28, y1 - 5),
          gen.circle(x0 + 14, (y0 + y1) / 2, 13),
        ],
      }
    }
    case 'person': {
      return {
        body: roundRect(box),
        details: gen => [
          gen.circle(x1 - 46, y1 - 62, 34),
          gen.path(`M${x1 - 86},${y1 - 2} C${x1 - 84},${y1 - 46} ${x1 - 8},${y1 - 46} ${x1 - 6},${y1 - 2}`),
        ],
      }
    }
    case 'component': {
      const tab = (gen: Generator, y: number) => gen.rectangle(x0 - 10, y, 30, 14, { fill: FILL, fillStyle: 'solid' })
      return {
        body: roundRect(box),
        details: gen => [tab(gen, y0 + 16), tab(gen, y0 + 40)],
      }
    }
    case 'agent': {
      const cx = (x0 + x1) / 2
      return {
        body: roundRect(box),
        details: gen => [
          gen.line(cx, y0, cx, y0 - 14),
          gen.circle(cx, y0 - 19, 11, { fill: FILL, fillStyle: 'solid' }),
        ],
      }
    }
    default: {
      return { body: roundRect(box) }
    }
  }
}

/**
 * Every node gets its own sketch, the same on each render
 */
function seedOf(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(hash) + 1
}

function sketch(shape: string, width: number, height: number, seed: number) {
  const gen = rough.generator({
    options: {
      seed,
      roughness: 1.8,
      bowing: 1.5,
      stroke: STROKE,
      strokeWidth: 2.5,
      preserveVertices: true,
    },
  })
  const box: Box = {
    x0: INSET,
    y0: INSET,
    x1: width - INSET,
    y1: height - INSET,
    w: width - INSET * 2,
    h: height - INSET * 2,
  }
  const { body, details } = silhouette(shape, box)
  return {
    // Solid fill keeps the text readable
    fill: gen.toPaths(gen.path(body, { stroke: 'none', fill: FILL, fillStyle: 'solid', roughness: 0 })),
    // Hatching on top of it
    hatching: gen.toPaths(
      gen.path(body, {
        stroke: 'none',
        fill: STROKE,
        fillStyle: 'hachure',
        fillWeight: 2.5,
        hachureGap: 8,
        hachureAngle: -50,
      }),
    ),
    outline: gen.toPaths(gen.path(body)),
    details: (details?.(gen, box) ?? []).flatMap(drawable => gen.toPaths(drawable)),
  }
}

/**
 * Colors are CSS variables of the node, they have to be set through `style`
 */
const Paths = ({ paths }: { paths: PathInfo[] }) =>
  paths.map((path, i) => (
    <path
      key={i}
      d={path.d}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        fill: path.fill ?? 'none',
        stroke: path.stroke,
        strokeWidth: path.strokeWidth,
      }}
    />
  ))

/**
 * Hand-drawn replacement of the element shape.
 * It is rendered for every node, so the sketch is memoized.
 */
export function RoughShape({ data, width: w, height: h }: ElementShapeProps) {
  const id = useId()
  const { shape } = data
  const width = w && w > 10 ? w : data.width
  const height = h && h > 10 ? h : data.height
  const { fill, hatching, outline, details } = useMemo(
    () => sketch(shape, width, height, seedOf(id)),
    [shape, width, height, id],
  )
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <Paths paths={fill} />
      <g opacity={0.85}>
        <Paths paths={hatching} />
      </g>
      <Paths paths={outline} />
      <g opacity={0.8}>
        <Paths paths={details} />
      </g>
    </svg>
  )
}
