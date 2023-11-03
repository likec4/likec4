/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import { useSpring, type SpringValues } from '@react-spring/konva'
import { AnimatedLine, AnimatedRect, AnimatedText } from '../../konva'

import {
  DefaultArrowType,
  type BBox,
  type NonEmptyArray,
  type Point,
  type RelationshipArrowType,
  DefaultLineStyle,
  DefaultRelationshipColor
} from '@likec4/core'
import type { KonvaNodeEvents } from 'react-konva/es/ReactKonvaCore'
import type { DiagramEdge, LikeC4Theme } from '../types'

type GlobalCompositeOperationType =
  | ''
  | 'source-over'
  | 'source-in'
  | 'source-out'
  | 'source-atop'
  | 'destination-over'
  | 'destination-in'
  | 'destination-out'
  | 'destination-atop'
  | 'lighter'
  | 'copy'
  | 'xor'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'

// const lineColor = '#6E6E6E'
// const labelBgColor = '#18191b'
// const labelColor = '#C6C6C6'
function EdgeArrow({
  arrowType,
  points,
  springs,
  globalCompositeOperation
}: {
  arrowType: Exclude<RelationshipArrowType, 'none'>
  points: NonEmptyArray<Point>
  springs: EdgeProps['springs']
  globalCompositeOperation: GlobalCompositeOperationType
}) {
  const isOutline = arrowType === 'odiamond' || arrowType === 'onormal'
  return (
    <AnimatedLine
      opacity={springs.opacity}
      points={points.flat()}
      closed={true}
      fill={isOutline ? undefined : springs.lineColor}
      stroke={springs.lineColor}
      strokeWidth={1.6}
      hitStrokeWidth={5}
      lineCap={'round'}
      lineJoin={'miter'}
      globalCompositeOperation={globalCompositeOperation}
    />
  )
}

function EdgeLabelBg({
  animate,
  labelBBox,
  isHovered,
  springs
}: {
  animate: boolean
  labelBBox: BBox
  isHovered: boolean
  springs: EdgeProps['springs']
}) {
  const padding = 4
  const props = useSpring({
    to: {
      x: labelBBox.x - padding,
      y: labelBBox.y - padding,
      width: labelBBox.width + padding * 2,
      height: labelBBox.height + padding * 2,
      opacity: isHovered ? 0.25 : 0.1
    },
    immediate: !animate
  })
  return (
    <AnimatedRect
      {...props}
      fill={springs.labelBgColor}
      cornerRadius={2}
      globalCompositeOperation='darken'
      hitStrokeWidth={5}
    />
  )
}

export interface EdgeProps extends KonvaNodeEvents {
  animate?: boolean | undefined
  edge: DiagramEdge
  theme: LikeC4Theme
  isHovered: boolean
  springs: SpringValues<{
    lineColor: string
    lineWidth: number
    opacity: number
    labelBgColor: string
    labelColor: string
  }>
}
export function Edge({ animate = true, edge, theme, isHovered, springs }: EdgeProps) {
  const {
    points,
    head,
    color,
    line = DefaultLineStyle,
    headArrow,
    tail,
    tailArrow,
    labelBBox,
    labels
  } = edge

  const globalCompositeOperation: GlobalCompositeOperationType =
    !color || color === DefaultRelationshipColor ? 'luminosity' : 'lighten'

  const isDotted = line === 'dotted'
  const isDashed = isDotted || line === 'dashed'

  let dash
  if (isDotted) {
    dash = [1, 5]
  } else if (isDashed) {
    dash = [10, 8]
  }

  return (
    <>
      <AnimatedLine
        opacity={springs.opacity}
        bezier={true}
        dashEnabled={isDashed}
        dashOffset={1}
        points={points.flat()}
        dash={dash}
        stroke={springs.lineColor}
        strokeWidth={springs.lineWidth}
        hitStrokeWidth={20}
        lineCap={'round'}
        lineJoin={'round'}
        globalCompositeOperation={globalCompositeOperation}
      />
      {head !== 'none' && headArrow && (
        <EdgeArrow
          key='head'
          arrowType={head ?? DefaultArrowType}
          points={headArrow}
          springs={springs}
          globalCompositeOperation={globalCompositeOperation}
        />
      )}
      {tail !== 'none' && tailArrow && (
        <EdgeArrow
          key='tail'
          arrowType={tail ?? DefaultArrowType}
          points={tailArrow}
          springs={springs}
          globalCompositeOperation={globalCompositeOperation}
        />
      )}
      {labelBBox && labelBBox.width > 0 && (
        <EdgeLabelBg
          animate={animate}
          labelBBox={labelBBox}
          isHovered={isHovered}
          springs={springs}
        />
      )}
      {labels &&
        labels.map((label, i) => (
          <AnimatedText
            key={i}
            x={label.pt[0]}
            y={label.pt[1] - label.fontSize}
            opacity={springs.opacity}
            fill={springs.labelColor}
            fontFamily={theme.font}
            fontSize={label.fontSize}
            fontStyle={label.fontStyle ?? 'normal'}
            text={label.text}
            listening={false}
            globalCompositeOperation={globalCompositeOperation}
            shadowEnabled={springs.opacity.to(o => o > 0.5)}
            shadowColor={'#222'}
            shadowOpacity={0.15}
            shadowOffsetX={1}
            shadowOffsetY={2}
            shadowBlur={2}
          />
        ))}
    </>
  )
}
