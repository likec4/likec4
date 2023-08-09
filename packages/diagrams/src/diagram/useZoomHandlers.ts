import type { SpringRef } from '@react-spring/konva'
import type Konva from 'konva'
import { clamp } from 'rambdax'
import { useMemo } from 'react'

export function useZoomHandlers(
  zoomable: boolean,
  stageSpringApi: SpringRef<{
    x: number
    y: number
    scale: number
  }>
) {
  return useMemo(() => {
    if (!zoomable) {
      return {}
    }
    return {
      onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => {
        const stage = e.target.getStage()
        const pointer = stage?.getPointerPosition()
        if (!stage || !pointer || Math.abs(e.evt.deltaY) < 3 || stage.isDragging()) {
          return
        }
        e.cancelBubble = true
        e.evt.preventDefault()

        const zoomStep = 1 + clamp(0.02, 0.2, Math.abs(e.evt.deltaY) / 80)

        let direction = e.evt.deltaY > 0 ? 1 : -1

        const oldScale = stage.scaleX()
        const stageX = stage.x()
        const stageY = stage.y()

        const mousePointTo = {
          x: (pointer.x - stageX) / oldScale,
          y: (pointer.y - stageY) / oldScale
        }

        // when we zoom on trackpad, e.evt.ctrlKey is true
        // in that case lets revert direction
        if (e.evt.ctrlKey) {
          direction = -direction
        }

        let newScale = direction > 0 ? oldScale * zoomStep : oldScale / zoomStep

        newScale = clamp(0.1, 2, newScale)
        stageSpringApi.start({
          to: {
            scale: newScale,
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale
          }
        })
      }
    }
  }, [zoomable, stageSpringApi])
}
