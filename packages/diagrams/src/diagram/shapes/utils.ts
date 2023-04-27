import type { OnMouseEvent } from './types'

export const mousePointer = (e: OnMouseEvent) => {
  const container = e.target.getStage()?.container()
  if (container) {
    container.style.cursor = 'pointer'
  }
}

export const mouseDefault = (e: OnMouseEvent) => {
  const container = e.target.getStage()?.container()
  if (container) {
    container.style.cursor = 'auto'
  }
}

export function unexhaustive(arg: never, message = 'Unexhaustive value: '): never {
  throw new Error(message + ': ' + JSON.stringify(arg))
}
