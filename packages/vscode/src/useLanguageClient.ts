import useDocumentSelector from '#useDocumentSelector'
import useEnvLanguageClient from '#useLanguageClient'
import { watchDebounced } from '@reactive-vscode/vueuse'
import { deepEqual } from 'fast-equals'
import {
  defineService,
  useDisposable,
  watch,
} from 'reactive-vscode'
import { State } from 'vscode-languageclient'
import { config } from './config'
import { isDev } from './const'
import { useExtensionLogger } from './useExtensionLogger'
import { useIsActivated } from './useIsActivated'

function stateName(state: State) {
  switch (state) {
    case State.Stopped:
      return 'Stopped'
    case State.Starting:
      return 'Starting'
    case State.Running:
      return 'Running'
    case State.StartFailed:
      return 'StartFailed'
  }
}

/**
 * Reactively provides language client instance (based on environment) and methods to start/restart it
 */
export const useLanguageClient = defineService(() => {
  const isActivated = useIsActivated()
  const { logger } = useExtensionLogger('lc')

  const client = useEnvLanguageClient()

  function startLanguageServer() {
    if (client.isRunning()) {
      isActivated.value = true
      logger.error('language server is already running')
      return
    }
    logger.info('starting language server')
    client.start()
      .then(() => {
        logger.info('language server started')
        isActivated.value = true
      })
      .catch(error => {
        logger.error('Failed to start language server', { error })
      })
  }

  const documentSelector = useDocumentSelector()

  if (isDev) {
    useDisposable(client.onDidChangeState((event) => {
      logger.debug(`onDidChangeState: ${stateName(event.oldState)} -> ${stateName(event.newState)}`)
    }))
  }

  async function restartLanguageServer() {
    client.outputChannel.clear()
    if (client.isRunning()) {
      logger.info('stopping language server')
      await client.stop()
    }
    logger.info('restarting language server')
    await client.start()
    logger.info('language server restarted')
    isActivated.value = true
  }

  watch(documentSelector, async (selector) => {
    logger.info('updated document selector', { selector })
    client.clientOptions.documentSelector = selector
    await restartLanguageServer()
  })

  // Any `likec4.*` change re-reads the whole configuration, so `exclude` comes back as a new array.
  // Restart only when its content changed, not on unrelated settings such as `likec4.export.*`.
  watchDebounced(() => config.exclude, (exclude, previous) => {
    if (deepEqual(exclude, previous)) {
      return
    }
    logger.debug`${'exclude'} configuration changed, restarting language server`
    void restartLanguageServer()
  }, {
    deep: true,
    debounce: 800,
  })

  return {
    client,
    startLanguageServer,
    restartLanguageServer,
  }
})
