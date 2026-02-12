import { WithFileSystem, WithLikeC4ManualLayouts } from '@likec4/language-server/filesystem'
import {
  createLanguageServices as createCustomLanguageServices,
  NoFileSystem,
  NoLikeC4ManualLayouts,
} from '@likec4/language-server/module'
import { GraphvizWasmAdapter, QueueGraphvizLayoter } from '@likec4/layouts'
import { GraphvizBinaryAdapter } from '@likec4/layouts/graphviz/binary'
import { rootLogger } from '@likec4/log'
import defu from 'defu'
import k from 'tinyrainbow'
import type { LikeC4Langium } from '../../common/LikeC4'

export type CreateLanguageServiceOptions = {
  /**
   * Whether to use the file system for the language service.
   * @default true
   */
  useFileSystem?: boolean

  /**
   * Whether to read manual layouts from the workspace.
   * @default true
   */
  manualLayouts?: boolean

  /**
   * Whether to watch for changes in the workspace.
   * @default false
   */
  watch?: boolean

  /**
   * Whether to use the `dot` binary for layouting or the WebAssembly version.
   * @default 'wasm'
   */
  graphviz?: 'wasm' | 'binary'
}

export function createLanguageServices(
  opts?: CreateLanguageServiceOptions,
): LikeC4Langium {
  const logger = rootLogger.getChild('lang')

  const options = defu(opts, {
    useFileSystem: true,
    manualLayouts: true,
    watch: false,
    graphviz: 'wasm',
  })

  const useDotBin = options.graphviz === 'binary'

  logger.info(`${k.dim('layout')} ${useDotBin ? 'binary' : 'wasm'}`)

  const langium = createCustomLanguageServices(
    {
      ...options.useFileSystem
        ? {
          ...WithFileSystem(options.watch),
          ...options.manualLayouts ? WithLikeC4ManualLayouts : NoLikeC4ManualLayouts,
        }
        : {
          ...NoFileSystem,
          ...NoLikeC4ManualLayouts,
        },
    },
    {
      likec4: {
        Layouter: () =>
          new QueueGraphvizLayoter({
            graphviz: useDotBin ? new GraphvizBinaryAdapter() : new GraphvizWasmAdapter(),
          }),
      },
    },
  )

  return langium
}
