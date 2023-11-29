import { is } from 'rambdax'
import type { KonvaPointerEvent } from './types'

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
