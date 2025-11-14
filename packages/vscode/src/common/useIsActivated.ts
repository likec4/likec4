import { createSingletonComposable, onDeactivate, useVscodeContext, watch } from 'reactive-vscode'
import { isFunction } from 'remeda'

/**
 * Reactively reads/writes if language client is activated
 *
 * Note:\
 * This is not the same as extension activation\
 * Language client activation is triggered by opening a file with languageId 'likec4' or diagram preview panel
 */
export const useIsActivated = createSingletonComposable(() => {
  const activated = useVscodeContext('likec4.activated', false)

  onDeactivate(() => {
    activated.value = false
  })

  return activated
})

export function whenExtensionActive(callback: () => void): void
export function whenExtensionActive(callbacks: { onStart: () => void; onStop?: () => void }): void
export function whenExtensionActive(arg: (() => void) | { onStart: () => void; onStop?: () => void }): void {
  const activated = useIsActivated()
  let callback: () => void
  let onDeactivate: (() => void) | undefined
  if (isFunction(arg)) {
    callback = arg
  } else {
    callback = arg.onStart
    onDeactivate = arg.onStop
  }
  watch(activated, (isActive) => {
    if (isActive) {
      callback()
    } else {
      onDeactivate?.()
    }
  })
}
