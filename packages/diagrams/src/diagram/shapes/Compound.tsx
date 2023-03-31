import type { DiagramNode } from '@likec4/core/types'
import { Text } from 'react-konva'
import type { DiagramTheme } from '../types'
import { memo, useEffect, useMemo } from 'react'
import { animated, useSpring } from '@react-spring/konva'
import type { OnClickEvent } from './types'
import { isEqualReactSimple as deepEqual } from '@react-hookz/deep-equal/esm'
import { useFirstMountState } from '@react-hookz/web/esm'

interface CompoundProps {
  animate?: boolean,
  node: DiagramNode
  theme: DiagramTheme
  onNodeClick?: ((node: DiagramNode) => void) | undefined
}

export const CompoundShape = memo(({
  animate = true,
  node,
  theme,
  onNodeClick
}: CompoundProps) => {
  const { id, size: { width, height }, position: [x, y], color } = node
  const {
    hiContrast,
    fill,
    shadow: shadowColor
  } = theme.colors[color]

  const isFirstRender = useFirstMountState() && animate

  const [groupProps, groupPropsApi] = useSpring(
    () => {
      const offsetX = Math.round(width / 2)
      const offsetY = Math.round(height / 2)
      return {
        x: x + offsetX,
        y: y + offsetY,
        offsetX,
        offsetY,
        width,
        height,
        scaleX: isFirstRender ? 0.85 : 1,
        scaleY: isFirstRender ? 0.85 : 1,
      }
    },
    [x, y, width, height, isFirstRender]
  )

  // On Enter
  useEffect(() => {
    if (animate) {
      groupPropsApi.start({
        delay: 10,
        to: {
          scaleX: 1,
          scaleY: 1
        },
      })
    }
  }, [])

  // useUpdateEffect(() => {
  //   const offsetX = Math.round(width / 2)
  //   const offsetY = Math.round(height / 2)
  //   groupPropsApi.start({
  //     to: {
  //       x: x + offsetX,
  //       y: y + offsetY,
  //       offsetX,
  //       offsetY,
  //       width,
  //       height,
  //       scaleX: 1,
  //       scaleY: 1
  //     },
  //   })
  // }, [x, y, width, height])


  const [rectProps] = useSpring(
    () => ({
      width,
      height,
      fill,
      shadowColor
    }),
    [width, height, fill, shadowColor]
  )

  const listeners = useMemo(() => {
    if (!onNodeClick) return {}
    return {
      onClick: (evt: OnClickEvent) => {
        evt.cancelBubble = true
        onNodeClick(node)
      }
    }
  }, [node, onNodeClick ?? null])

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return <animated.Group
    {...groupProps}
    id={'compound_' + id}
  >
    <animated.Rect
      {...rectProps}
      opacity={0.25}
      cornerRadius={4}
      shadowBlur={12}
      shadowOpacity={0.45}
      shadowOffsetX={0}
      shadowOffsetY={8}
    />
    <Text
      x={0}
      y={0}
      width={width}
      fill={hiContrast}
      fontSize={12}
      fontFamily={theme.font}
      wrap={'none'}
      ellipsis={true}
      align={'left'}
      text={node.title}
      padding={10}
      opacity={0.65}
      {...listeners}
    />
  </animated.Group>
}, deepEqual)
