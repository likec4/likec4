import { is } from 'rambdax'
import type { DiagramEdge, DiagramNode, IRect, KonvaPointerEvent } from './types'

export function mousePointer(e: KonvaPointerEvent) {
  const container = e.target.getStage()?.container()
  if (container) {
    container.style.cursor = 'pointer'
  }
}

export function mouseDefault(e: KonvaPointerEvent) {
  const container = e.target.getStage()?.container()
  if (container) {
    container.style.cursor = ''
  }
}

export const isNumber = is(Number)

export const getBoundingRect = (elements: (DiagramNode | DiagramEdge)[]): IRect => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const element of elements) {
    if ('position' in element) {
      minX = Math.min(minX, element.position[0])
      minY = Math.min(minY, element.position[1])
      maxX = Math.max(maxX, element.position[0] + element.width)
      maxY = Math.max(maxY, element.position[1] + element.height)
      continue
    }
    element.points.forEach(([x, y]) => {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    })
    if (element.labelBBox) {
      minX = Math.min(minX, element.labelBBox.x)
      minY = Math.min(minY, element.labelBBox.y)
      maxX = Math.max(maxX, element.labelBBox.x + element.labelBBox.width)
      maxY = Math.max(maxY, element.labelBBox.y + element.labelBBox.height)
    }
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}
