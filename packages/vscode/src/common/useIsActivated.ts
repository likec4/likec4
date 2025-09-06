import { createSingletonComposable, effectScope, onDeactivate, useVscodeContext, watch } from 'reactive-vscode'
import { logError, logger } from '../logger'

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

export function whenExtensionActive(callback: () => void, onDeactivate?: () => void) {
  const activated = useIsActivated()
  watch(activated, (isActive, prevActive, onCleanup) => {
    if (prevActive && !isActive) {
      onDeactivate?.()
    }
    if (!isActive) {
      return
    }
    const scope = effectScope()
    scope.run(() => {
      try {
        callback()
      } catch (error) {
        logger.error('Failed to run callback in whenExtensionActive', { error })
      }
    })

    onCleanup(() => {
      try {
        scope.stop()
      } catch (e) {
        logError(e)
      }
    })
  }, {
    immediate: true,
  })
}
