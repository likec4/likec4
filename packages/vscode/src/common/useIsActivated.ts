import { createSingletonComposable, effectScope, onWatcherCleanup, useVscodeContext, watch } from 'reactive-vscode'
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
  return activated
})

export function whenExtensionActive(callback: () => void, onDeactivate?: () => void) {
  const activated = useIsActivated()
  watch(activated, (isActivate) => {
    if (!isActivate) {
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

    onWatcherCleanup(() => {
      try {
        onDeactivate?.()
        scope.stop()
      } catch (e) {
        logError(e)
      }
    })
  }, {
    immediate: true,
  })
}
