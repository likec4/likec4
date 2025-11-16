import useDocumentSelector from '#useDocumentSelector'
import useEnvLanguageClient from '#useLanguageClient'
import {
  createSingletonComposable,
  useDisposable,
  watch,
} from 'reactive-vscode'
import { State } from 'vscode-languageclient'
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
  }
}

/**
 * Reactively provides language client instance (based on environment) and methods to start/restart it
 */
export const useLanguageClient = createSingletonComposable(() => {
  const isActivated = useIsActivated()
  const { logger } = useExtensionLogger('lc')

  const client = useEnvLanguageClient()

  function startLanguageServer() {
    if (client.isRunning()) {
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
  }

  watch(documentSelector, async (selector) => {
    logger.info('updated document selector', { selector })
    client.clientOptions.documentSelector = selector
    await restartLanguageServer()
  })

  return {
    client,
    startLanguageServer,
    restartLanguageServer,
  }
})
