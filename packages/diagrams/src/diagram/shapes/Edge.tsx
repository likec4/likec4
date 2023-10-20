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
  DefaultLineStyle
} from '@likec4/core'
import type { KonvaNodeEvents } from 'react-konva/es/ReactKonvaCore'
import type { DiagramEdge, LikeC4Theme } from '../types'

// const lineColor = '#6E6E6E'
// const labelBgColor = '#18191b'
// const labelColor = '#C6C6C6'
function EdgeArrow({
  arrowType,
  points,
  springs
}: {
  arrowType: Exclude<RelationshipArrowType, 'none'>
  points: NonEmptyArray<Point>
  springs: EdgeShapeProps['springs']
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
      globalCompositeOperation={'luminosity'}
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
  springs: EdgeShapeProps['springs']
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

export interface EdgeShapeProps extends KonvaNodeEvents {
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
export function EdgeShape({ animate = true, edge, theme, isHovered, springs }: EdgeShapeProps) {
  const {
    points,
    head,
    line = DefaultLineStyle,
    headArrow,
    tail,
    tailArrow,
    labelBBox,
    labels
  } = edge

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
        globalCompositeOperation={'luminosity'}
      />
      {head !== 'none' && headArrow && (
        <EdgeArrow
          key='head'
          arrowType={head ?? DefaultArrowType}
          points={headArrow}
          springs={springs}
        />
      )}
      {tail !== 'none' && tailArrow && (
        <EdgeArrow
          key='tail'
          arrowType={tail ?? DefaultArrowType}
          points={tailArrow}
          springs={springs}
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
            y={label.pt[1]}
            offsetY={label.fontSize / 2}
            opacity={springs.opacity}
            fill={springs.labelColor}
            fontFamily={theme.font}
            fontSize={label.fontSize}
            fontStyle={label.fontStyle ?? 'normal'}
            text={label.text}
            perfectDrawEnabled={false}
            listening={false}
            globalCompositeOperation='luminosity'
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
