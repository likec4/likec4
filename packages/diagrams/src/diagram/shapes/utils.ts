import type { KonvaPointerEvent } from '../types'

export function mousePointer(e: KonvaPointerEvent) {
  const container = e.target.getStage()?.container()
  if (container) {
    container.style.cursor = 'pointer'
  }
}

export function mouseDefault(e: KonvaPointerEvent) {
  const container = e.target.getStage()?.container()
  if (container) {
    container.style.cursor = 'auto'
  }
}
