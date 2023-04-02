import type { DiagramNode } from '@likec4/core/types'
import { isEqualReactSimple as deepEqual } from '@react-hookz/deep-equal/esm'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type Konva from 'konva'
import { Group, Text } from 'react-konva'
import { animated, useSpring } from '@react-spring/konva'
import type { OnClickEvent, OnMouseEvent } from './types'
import type { DiagramTheme } from '../types'
import { mouseDefault, mousePointer } from './utils'
import { useFirstMountState } from '@react-hookz/web/esm'


const Sizes = {
  width: 250,
  maxWidth: 330,
  height: 140,
  padding: 24,
  title: {
    fontSize: 15,
    lineHeight: 1.12
  },
  description: {
    fontSize: 13,
    lineHeight: 1.12
  }
} as const

interface NodeTitleProps extends Konva.GroupConfig {
  node: DiagramNode
  theme: DiagramTheme
}


export const NodeTitle = ({
  node,
  theme,
  ...props
}: NodeTitleProps) => {
  const { size: { width }, title, description, color } = node
  const colors = theme.colors[color]

  const hasDescription = description && description.length > 0

  const titleRef = useRef<Konva.Text | null>(null)
  const descriptionRef = useRef<Konva.Text | null>(null)

  const [[titleHeight, descHeight], setHeights] = useState([
    Sizes.title.lineHeight * Sizes.title.fontSize + Sizes.padding * 2,
    hasDescription ? Sizes.description.lineHeight * Sizes.description.fontSize + Sizes.padding * 2 : 0
  ] as const)

  useEffect(() => {
    if (!titleRef.current) return
    const titleHeight = titleRef.current.height()
    const descHeight = descriptionRef.current?.height() ?? 0
    setHeights([titleHeight, descHeight])
  }, [title, description, width])

  const descYDelta = Sizes.padding + Sizes.title.fontSize

  const groupHeight = titleHeight + (hasDescription ? (descHeight - descYDelta) : 0)
  const offsetY = Math.round(groupHeight / 2)

  return <Group {...props} offsetY={offsetY}>
    <Text
      ref={titleRef}
      x={0}
      y={0}
      width={width}
      fill={colors.hiContrast}
      fontSize={Sizes.title.fontSize}
      fontFamily={theme.font}
      lineHeight={Sizes.title.lineHeight}
      align={'center'}
      padding={Sizes.padding}
      text={title}
    />
    {hasDescription &&
      <Text
        ref={descriptionRef}
        x={0}
        y={titleHeight - descYDelta}
        width={width}
        fill={colors.loContrast}
        fontSize={Sizes.description.fontSize}
        fontFamily={theme.font}
        lineHeight={Sizes.description.lineHeight}
        align={'center'}
        padding={Sizes.padding}
        text={description}
      />
    }
  </Group>
}
interface RectangleShapeProps {
  animate?: boolean
  node: DiagramNode
  theme: DiagramTheme
  onNodeClick?: ((node: DiagramNode) => void) | undefined
}


export const RectangleShape = memo(({
  animate = true,
  node,
  theme,
  onNodeClick
}: RectangleShapeProps) => {
  const { id, size: { width, height }, position: [x, y], color } = node
  const offsetX = Math.round(width / 2)
  const offsetY = Math.round(height / 2)
  const {
    fill,
    shadow: shadowColor
  } = theme.colors[color]

  const onClick = useMemo(() => {
    if (!onNodeClick) return undefined
    return (evt: OnClickEvent) => {
      evt.cancelBubble = true
      onNodeClick(node)
    }
  }, [node, onNodeClick ?? null])

  // const isFirstRenderRef = useRef(animate)
  const isFirstRender = useFirstMountState() && animate

  const [groupProps, groupPropsApi] = useSpring(
    () => {
      // const isFirstRender = isFirstRenderRef.current
      return {
        x: x + offsetX,
        y: y + offsetY,
        offsetX,
        offsetY,
        width,
        height,
        scaleX: isFirstRender ? 0.75 : 1,
        scaleY: isFirstRender ? 0.75 : 1,
      }
    },
    [x, y, width, height, offsetX, offsetY, isFirstRender]
  )

  // On first render
  useEffect(() => {
    if (animate) {
      groupPropsApi.start({
        delay: 20,
        to: {
          scaleX: 1,
          scaleY: 1
        },
      })
    }
  }, [])

  const [rectProps] = useSpring(
    () => ({
      width,
      height,
      fill,
      shadowColor
    }),
    [width, height, fill, shadowColor]
  )

  const listeners = {
    onMouseEnter: useCallback((e: OnMouseEvent) => {
      mousePointer(e)
      groupPropsApi.start({ scaleX: 1.04, scaleY: 1.04 })
    }, [groupPropsApi]),
    onMouseLeave: useCallback((e: OnMouseEvent) => {
      mouseDefault(e)
      groupPropsApi.start({ scaleX: 1, scaleY: 1 })
    }, [groupPropsApi])
  }

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return <animated.Group
    id={'node_' + id}
    {...groupProps}
    onClick={onClick}
    onMouseEnter={animate ? listeners.onMouseEnter : undefined}
    onMouseLeave={animate ? listeners.onMouseLeave : undefined}
  >
    <animated.Rect
      cornerRadius={6}
      shadowBlur={12}
      shadowOpacity={0.3}
      shadowOffsetX={0}
      shadowOffsetY={8}
      {...rectProps}
    />
    <NodeTitle
      y={offsetY}
      node={node}
      theme={theme}
    />
  </animated.Group>
}, deepEqual)
