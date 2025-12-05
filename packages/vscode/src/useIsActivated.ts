import {
  type EffectScope,
  createSingletonComposable,
  effectScope,
  onDeactivate,
  tryOnScopeDispose,
  useVscodeContext,
  watch,
} from 'reactive-vscode'
import { isFunction } from 'remeda'
import { useExtensionLogger } from './useExtensionLogger'

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
  let _onDeactivate: (() => void) | undefined
  if (isFunction(arg)) {
    callback = arg
  } else {
    callback = arg.onStart
    _onDeactivate = arg.onStop
  }

  let scope: EffectScope | undefined

  const dispose = () => {
    const s = scope
    if (!s) {
      return
    }
    scope = undefined
    if (_onDeactivate) {
      s.run(() => {
        try {
          _onDeactivate()
        } catch {
          // ignore errors in onStop
        }
      })
    }
    s.stop()
  }

  watch(activated, (isActive) => {
    if (!isActive) {
      dispose()
      return
    }
    if (!scope) {
      const { logger } = useExtensionLogger()
      scope = effectScope(true)
      try {
        scope.run(callback)
      } catch (e) {
        logger.error('Error in whenExtensionActive callback', { error: e })
        dispose()
      }
    }
  }, {
    immediate: true,
  })

  tryOnScopeDispose(dispose)
}
