import consola from 'consola'
import fs from 'node:fs'
import { resolve } from 'node:path'
import k from 'picocolors'
import { build } from 'vite'
import { LanguageServices } from '../language-services'
import type { LikeC4ViteConfig } from './config.prod'
import { likec4Plugin } from './plugin'
//

export async function viteBuildLib(cfg?: LikeC4ViteConfig) {
  const root = resolve('dist/__app__')
  if (!fs.existsSync(root)) {
    throw new Error(`likec4 app root does not exist: ${root}`)
  }

  consola.info(`${k.cyan('likec4 app root')} ${k.dim(root)}`)

  const languageServices = cfg?.languageServices
    ?? (await LanguageServices.get({
      path: cfg?.workspaceDir ?? process.cwd(),
      logValidationErrors: true
    }))

  let outDir = cfg?.outputDir ?? resolve(languageServices.workspace, 'dist')
  outDir = resolve(outDir, 'public')
  consola.info(k.cyan('output') + ' ' + k.dim(outDir))

  // Static website
  await build({
    root,
    configFile: false,
    build: {
      outDir,
      emptyOutDir: false,
      minify: true,
      lib: {
        entry: 'src/lib/webcomponent.mjs',
        fileName(_format, _entryName) {
          return 'likec4-views.js'
        },
        formats: ['iife'],
        name: 'LikeC4Views'
      }
      // 100Kb
    },
    plugins: [
      likec4Plugin({ languageServices })
    ]
  })
}
