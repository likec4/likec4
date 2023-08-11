import type { KonvaPointerEvent } from '../types'

export const mousePointer = (e: KonvaPointerEvent) => {
  const container = e.target.getStage()?.container()
  if (container) {
    container.style.cursor = 'pointer'
  }
}

export const mouseDefault = (e: KonvaPointerEvent) => {
  const container = e.target.getStage()?.container()
  if (container) {
    container.style.cursor = 'auto'
  }
}
