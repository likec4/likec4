import { GraphvizWasmAdapter, QueueGraphvizLayoter } from '@likec4/layouts'
import { GraphvizBinaryAdapter } from '@likec4/layouts/graphviz/binary'
import { isEmpty } from 'remeda'
import which from 'which'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'

function graphvizBinPath() {
  try {
    return which.sync('dot')
  } catch (error) {
    logger.error('Error checking for native Graphviz:', { error })
    return null
  }
}

export const ConfigurableLayouter = {
  likec4: {
    Layouter(services: LikeC4Services): QueueGraphvizLayoter {
      logger.debug('Creating ConfigurableLayouter')
      const layouter = new QueueGraphvizLayoter()
      services.shared.workspace.ConfigurationProvider.onConfigurationSectionUpdate((update) => {
        logger.debug('Configuration update: {update}', { update })
        if (update.section !== services.LanguageMetaData.languageId) {
          logger.debug(`Ignoring configuration update as it is not for ${services.LanguageMetaData.languageId}`)
          return
        }

        try {
          const { mode, path } = update.configuration.graphviz ?? {
            mode: 'wasm',
            path: '',
          }

          if (mode !== 'wasm') {
            let binaryPath = isEmpty(path) ? graphvizBinPath() : path
            if (!isEmpty(binaryPath)) {
              layouter.changePort(new GraphvizBinaryAdapter(binaryPath))
              logger.info`use graphviz binary: ${binaryPath}`
              return
            }
            logger.warn(`No Graphviz binaries found on PATH, use graphviz wasm`)
            services.shared.lsp.Connection?.window.showWarningMessage(
              'No Graphviz binaries found on PATH, set path to binaries in settings.',
            )
          }

          layouter.changePort(new GraphvizWasmAdapter())
          logger.info('use graphviz wasm')
        } catch (error) {
          logger.error('Failed to update configuration', { error })
        }
      })

      return layouter
    },
  },
}
