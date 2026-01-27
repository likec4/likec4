/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { LikeC4 } from '../../LikeC4'
import { createLikeC4Logger } from '../../logger'
import { viteBuild } from '../../vite/vite-build'
import { ensureReact } from '../ensure-react'
import {
  base,
  outputSingleFile,
  path,
  title,
  useDotBin,
  useHashHistory,
  webcomponentPrefix,
} from '../options'

const buildCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'build [path]',
      aliases: ['bundle'],
      describe: 'Build a static website',
      builder: yargs =>
        yargs
          .positional('path', path)
          .option('output', {
            alias: 'o',
            type: 'string',
            desc: 'output directory for production build',
            normalize: true,
            coerce: resolve,
          })
          .option('base', base)
          .option('use-hash-history', useHashHistory)
          .option('use-dot', useDotBin)
          .option('webcomponent-prefix', webcomponentPrefix)
          .option('title', title)
          .option('output-single-file', outputSingleFile)
          .example(
            `${k.green('$0 build -o ./build ./src')}`,
            k.gray('Search for likec4 files in \'src\' and output static site to \'build\''),
          ),
      handler: async (args) => {
        const params = {
          useHashHistory: args['use-hash-history'] ?? false,
          useDotBin: args['use-dot'],
          webcomponentPrefix: args['webcomponent-prefix'],
          outputSingleFile: args['output-single-file'] ?? false,
        }

        await ensureReact()

        const logger = createLikeC4Logger('c4:build')

        await using languageServices = await LikeC4.fromWorkspace(args.path, {
          graphviz: args['use-dot'] ? 'binary' : 'wasm',
          watch: false,
        })

        const outputDir = args.output ?? resolve(languageServices.workspace, 'dist')
        let likec4AssetsDir = resolve(outputDir, 'assets')

        await viteBuild({
          base: args.base,
          useHashHistory: params.outputSingleFile || params.useHashHistory,
          customLogger: logger,
          webcomponentPrefix: params.webcomponentPrefix,
          title: args.title,
          languageServices,
          likec4AssetsDir,
          outputDir,
          outputSingleFile: params.outputSingleFile,
        })
      },
    })
}
export default buildCmd
