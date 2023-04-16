import { useSyncedRef } from '@react-hookz/web/esm'
import { animated, useSpring } from '@react-spring/konva'
import { useMemo } from 'react'
import { cylinderSVGPath, type CylinderShapeProps } from './Cylinder'
import { NodeTitle } from './Rectangle'
import type { OnClickEvent, OnMouseEvent } from './types'
import { mouseDefault, mousePointer } from './utils'

export const QueueShape = ({
  animate = true,
  node,
  theme,
  springs,
  onNodeClick
}: CylinderShapeProps) => {
  const { id, size: { width, height }, position: [x, y], color } = node
  const offsetX = Math.round(width / 2)
  const offsetY = Math.round(height / 2)
  const {
    fill,
    stroke,
    shadow: shadowColor
  } = theme.colors[color]

  const springsRef = useSyncedRef(springs ?? null)

  const [groupProps] = useSpring({
    to: {
      x: x + offsetX,
      y: y + offsetY,
      offsetX,
      offsetY
    },
    immediate: !animate
  }, [x, y, offsetX, offsetY])

  const path = useMemo(() => cylinderSVGPath(height / 2, width, 0.16), [width, height])

  const queueProps = useSpring({
    to: {
      x: offsetX,
      y: offsetY,
      offsetX: Math.ceil(height / 2),
      offsetY: Math.ceil(width / 2),
      fill,
      stroke,
      shadowColor
    },
    immediate: !animate
  })

  const listeners = useMemo(() => {
    if (!onNodeClick) return {}
    return {
      onMouseEnter: (e: OnMouseEvent) => {
        mousePointer(e)
        if (animate && springsRef.current) {
          const cfg = {
            config: {
              duration: 200
            }
          }
          springsRef.current.scaleX?.start(1.06, cfg)
          springsRef.current.scaleY?.start(1.06, cfg)
        }
      },
      onMouseLeave: (e: OnMouseEvent) => {
        mouseDefault(e)
        if (animate && springsRef.current) {
          const cfg = {
            delay: 100,
            config: {
              duration: 120
            }
          }
          springsRef.current.scaleX?.start(1, cfg)
          springsRef.current.scaleY?.start(1, cfg)
        }
      },
      onClick: (evt: OnClickEvent) => {
        evt.cancelBubble = true
        onNodeClick(node)
      }
    }
  }, [node, onNodeClick ?? null, animate])

  const tiltAdjustedWidth = Math.round((height / 2) * 0.16)

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return <animated.Group
    id={'node_' + id}
    {...listeners}
    {...springs}
    {...groupProps}
  >
    <animated.Path
      shadowBlur={12}
      shadowOpacity={0.3}
      shadowOffsetX={0}
      shadowOffsetY={8}
      rotation={90}
      data={path}
      width={springs?.height}
      height={springs?.width}
      {...queueProps}
    />
    <NodeTitle
      y={offsetY}
      offsetX={tiltAdjustedWidth}
      title={node.title}
      description={node.description ?? null}
      color={color}
      width={width - tiltAdjustedWidth}
      theme={theme}
    />
  </animated.Group>
}
