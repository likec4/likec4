import {
  defineService,
  effectScope,
  onWatcherCleanup,
  unref,
  useVscodeContext,
  watch,
} from 'reactive-vscode'
import { useExtensionLogger } from './useExtensionLogger'

/**
 * Reactively reads/writes if language client is activated
 *
 * Note:\
 * This is not the same as extension activation\
 * Language client activation is triggered by opening a file with languageId 'likec4' or diagram preview panel
 */
export const useIsActivated = defineService(() => {
  return useVscodeContext('likec4.activated', false)
})

export function whenExtensionActive(callback: () => void): void {
  const activated = useIsActivated()
  const { logger } = useExtensionLogger()

  watch(activated, (isActive) => {
    if (!isActive) {
      return
    }

    const scope = effectScope()
    onWatcherCleanup(() => scope.stop())

    scope.run(() => {
      try {
        callback()
      } catch (e) {
        logger.error('Error in whenExtensionActive callback', { error: e })
      }
    })
  }, {
    immediate: unref(activated),
  })
}
