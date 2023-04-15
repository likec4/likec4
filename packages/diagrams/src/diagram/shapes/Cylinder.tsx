import type { DiagramNode } from '@likec4/core/types'
import { useFirstMountState, useSyncedRef } from '@react-hookz/web/esm'
import { animated, useSpring, type SpringValues } from '@react-spring/konva'
import { useMemo } from 'react'
import type { DiagramTheme } from '../types'
import { NodeTitle } from './Rectangle'
import type { OnClickEvent, OnMouseEvent } from './types'
import { mouseDefault, mousePointer } from './utils'

function cylinderSVGPath(radius: number, height: number, tilt = 0.1) {
  const tiltAdjustedHeight = height - radius * tilt;
  const diameter = radius * 2;
  const rx = radius;
  const ry = Math.round(tilt * radius * 1000) / 1000;

  const d = `   M 0,${ry}
        a ${rx},${ry} 0,0,0 ${diameter} 0
        a ${rx},${ry} 0,0,0 ${-diameter} 0
        l 0,${tiltAdjustedHeight}
        a ${rx},${ry} 0,0,0 ${diameter} 0
        l 0,${-tiltAdjustedHeight}
        `
    .replace(/\s+/g, ' ')
    .trim();
  return d;
}

export interface CylinderShapeProps {
  animate?: boolean
  node: DiagramNode
  theme: DiagramTheme
  springs?: SpringValues<{
    opacity?: number
    scaleX?: number
    scaleY?: number
  }>
  onNodeClick?: ((node: DiagramNode) => void) | undefined
}


export const CylinderShape = ({
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

  const isFirstRender = useFirstMountState()

  const [groupProps] = useSpring({
    delay: isFirstRender && animate ? 50 : 0,
    to: {
      x: x + offsetX,
      y: y + offsetY,
      offsetX,
      offsetY,
      width,
      height
    },
    immediate: !animate
  }, [x, y, offsetX, offsetY])

  const path = useMemo(() => cylinderSVGPath(width / 2, height), [width, height])

  const cylinderProps = useSpring({
    to: {
      width,
      height,
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

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error, @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return <animated.Group
    id={'node_' + id}
    {...listeners}
    {...springs}
    {...groupProps}
  >
    <animated.Path
      cornerRadius={6}
      shadowBlur={12}
      shadowOpacity={0.3}
      shadowOffsetX={0}
      shadowOffsetY={8}
      data={path}
      {...cylinderProps}
    />
    <NodeTitle
      y={offsetY + Math.round((width / 2) * 0.08)}
      title={node.title}
      description={node.description ?? null}
      color={color}
      width={width}
      theme={theme}
    />
  </animated.Group>
}
