import { GraphvizLayouter, GraphvizWasmAdapter } from '@likec4/layouts'
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
    Layouter(services: LikeC4Services): GraphvizLayouter {
      logger.debug('Creating ConfigurableLayouter')
      const wasmAdapter = new GraphvizWasmAdapter()
      const layouter = new GraphvizLayouter(wasmAdapter)
      const langId = services.LanguageMetaData.languageId
      services.shared.workspace.ConfigurationProvider.onConfigurationSectionUpdate((update) => {
        logger.debug('Configuration update', { update })
        if (update.section === langId) {
          try {
            const { mode, path } = update.configuration.graphviz ?? {
              mode: 'wasm',
              path: '',
            }

            if (mode === 'wasm') {
              layouter.changePort(wasmAdapter)
              logger.info('use graphviz wasm')
              return
            }

            let binaryPath = isEmpty(path) ? graphvizBinPath() : path

            if (binaryPath === null) {
              layouter.changePort(wasmAdapter)
              logger.warn(`No Graphviz binaries found on PATH, use graphviz wasm`)
              services.shared.lsp.Connection?.window.showWarningMessage(
                'No Graphviz binaries found on PATH, set path to binaries in settings.',
              )
              return
            }

            layouter.changePort(new GraphvizBinaryAdapter(binaryPath))

            logger.info(`use graphviz binary: ${binaryPath}`)
          } catch (error) {
            logger.error('Failed to update configuration', { error })
          }
          return
        }

        logger.warn('Unexpected configuration update', { update })
      })

      return layouter
    },
  },
}
