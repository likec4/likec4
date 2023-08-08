import type { OnPointerEvent } from './types'

export const mousePointer = (e: OnPointerEvent) => {
  const container = e.target.getStage()?.container()
  if (container) {
    container.style.cursor = 'pointer'
  }
}

export const mouseDefault = (e: OnPointerEvent) => {
  const container = e.target.getStage()?.container()
  if (container) {
    container.style.cursor = 'auto'
  }
}
