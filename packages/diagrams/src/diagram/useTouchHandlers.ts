import type { SpringRef } from '@react-spring/konva'
import type Konva from 'konva'
import { clamp } from 'rambdax'
import { useMemo } from 'react'

type KonvaDragEvent = Konva.KonvaEventObject<DragEvent>

type Point = {
  x: number
  y: number
}

function getDistance(p1: Point, p2: Point) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

function getCenter(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  }
}

export function useTouchHandlers(
  pannable: boolean,
  stageSpringApi: SpringRef<{
    x: number
    y: number
    scale: number
  }>
) {
  return useMemo(() => {
    if (!pannable) {
      return {
        draggable: false
      }
    }
    let lastCenter: Point | null = null
    let lastDist = 0
    return {
      draggable: true,
      dragDistance: 5,
      onTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => {
        const touch1 = e.evt.touches[0]
        const touch2 = e.evt.touches[1]
        const stage = e.target.getStage()
        if (!touch1 || !touch2 || !stage) {
          return
        }

        e.evt.preventDefault()

        // if the stage was under Konva's drag&drop
        // we need to stop it, and implement our own pan logic with two pointers
        if (stage.isDragging()) {
          stage.stopDrag()
        }

        const p1 = {
          x: touch1.clientX,
          y: touch1.clientY
        }
        const p2 = {
          x: touch2.clientX,
          y: touch2.clientY
        }

        if (!lastCenter) {
          lastCenter = getCenter(p1, p2)
          return
        }
        const newCenter = getCenter(p1, p2)
        const dist = getDistance(p1, p2)

        if (!dist) {
          return
        }

        if (!lastDist) {
          lastDist = dist
        }

        const currentScale = stage.scaleX()
        // local coordinates of center point
        const pointTo = {
          // x: (newCenter.x - stage.x()) / stageScale,
          x: (newCenter.x - stage.x()) / currentScale,
          // y: (newCenter.y - stage.y()) / stageScale,
          y: (newCenter.y - stage.y()) / currentScale
        }

        const scale = clamp(0.1, 2, currentScale * (dist / lastDist))

        // calculate new position of the stage
        const dx = newCenter.x - lastCenter.x
        const dy = newCenter.y - lastCenter.y

        const newPos = {
          x: Math.round(newCenter.x - pointTo.x * scale + dx),
          y: Math.round(newCenter.y - pointTo.y * scale + dy)
        }

        stageSpringApi.set({
          x: newPos.x,
          y: newPos.y,
          scale: scale
        })

        lastDist = dist
        lastCenter = newCenter
      },
      onTouchEnd: (_e: Konva.KonvaEventObject<TouchEvent>) => {
        lastCenter = null
        lastDist = 0
      },
      onDragStart: (e: KonvaDragEvent) => {
        if (e.target.getStage() === e.target) {
          e.cancelBubble = true
        }
      },
      onDragMove: (e: KonvaDragEvent) => {
        if (e.target.getStage() === e.target) {
          stageSpringApi.set({
            x: e.target.x(),
            y: e.target.y()
          })
        }
      },
      onDragEnd: (e: KonvaDragEvent) => {
        if (e.target.getStage() === e.target) {
          e.cancelBubble = true
          lastCenter = null
          lastDist = 0
        }
      }
    }
  }, [pannable, stageSpringApi])
}
