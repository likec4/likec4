import { viteReactConfig } from '@/vite/config-react'
import { consola } from '@likec4/log'
import { existsSync } from 'node:fs'
import { stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { cwd } from 'node:process'
import stripIndent from 'strip-indent'
import k from 'tinyrainbow'
import { build } from 'vite'
import { LikeC4 } from '../../../LikeC4'
import { createLikeC4Logger, startTimer } from '../../../logger'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  useDotBin: boolean
  outfile: string | undefined
}

export async function reactHandler({ path, useDotBin, outfile }: HandlerParams) {
  const logger = createLikeC4Logger('c4:codegen')
  const timer = startTimer(logger)
  const languageServices = await LikeC4.fromWorkspace(path, {
    logger: 'vite',
    graphviz: useDotBin ? 'binary' : 'wasm'
  })

  logger.info(`${k.dim('format')} ${k.green('react')}`)

  const diagrams = await languageServices.diagrams()
  if (diagrams.length === 0) {
    process.exitCode = 1
    throw new Error('no views found')
  }

  diagrams.forEach(view => {
    if (view.hasLayoutDrift) {
      logger.warn(
        k.yellow('drift detected, manual layout can not be applied, view:') + ' ' + k.red(view.id)
      )
    }
  })

  let outfilepath = resolve(languageServices.workspace, 'likec4-views.mjs')
  if (outfile) {
    outfilepath = isAbsolute(outfile) ? outfile : resolve(outfile)
    if (existsSync(outfile)) {
      const stats = await stat(outfile)
      if (stats.isDirectory()) {
        throw new Error(`output file is a directory: ${outfile}`)
      }
    }
  }
  // logger.info(`${k.dim('outfilepath')} ${outfilepath}`)

  const outDir = dirname(outfilepath)
  logger.info(`${k.dim('outdir')} ${outDir}`)
  const filename = basename(outfilepath)
  logger.info(`${k.dim('filename')} ${filename}`)

  const ext = extname(filename).toLocaleLowerCase()
  if (!['.js', '.mjs', '.jsx'].includes(ext)) {
    logger.error(`output file ${outfile} has extension "${ext}"`)
    throw new Error(`output file ${outfile} must be a .js, .jsx or .mjs`)
  }

  const cfg = await viteReactConfig({
    languageServices,
    outDir,
    filename
  })

  await build({
    ...cfg,
    logLevel: 'warn'
  })

  const all = diagrams.reduce((acc, d) => {
    acc.ids.add(d.id)
    d.tags?.forEach((t) => acc.tags.add(t))
    d.nodes.forEach((n) => {
      n.tags?.forEach((t) => acc.tags.add(t))
      acc.kinds.add(n.kind)
    })
    d.edges.forEach(e => {
      e.tags?.forEach((t) => acc.tags.add(t))
    })
    return acc
  }, {
    ids: new Set<string>(),
    tags: new Set<string>(),
    kinds: new Set<string>()
  })

  const ids = [...all.ids].toSorted().map(v => `  | ${JSON.stringify(v)}`)

  const tags = [...all.tags].toSorted().map(v => `  | ${JSON.stringify(v)}`)
  if (tags.length === 0) {
    tags.push('  | never')
  }

  const kinds = [...all.kinds].toSorted().map(v => `  | ${JSON.stringify(v)}`)
  if (kinds.length === 0) {
    kinds.push('  | never')
  }

  await writeFile(
    resolve(outDir, basename(outfilepath, ext) + (ext === '.mjs' ? '.d.mts' : '.d.ts')),
    `
/* prettier-ignore-start */
/* eslint-disable */

/******************************************************************************
 * This file was generated
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

import type { JSX } from 'react'
import type { LikeC4ViewBaseProps, ViewData } from 'likec4/react'

type LikeC4ViewId =
${ids.join('\n')}

type LikeC4Tag =
${tags.join('\n')}

type LikeC4ElementKind =
${kinds.join('\n')}

type LikeC4ViewData = ViewData<LikeC4ViewId>

/**
 * @deprecated alias, use LikeC4ViewData instead
 */
type LikeC4DiagramView = LikeC4ViewData

declare const LikeC4Views: Record<LikeC4ViewId, LikeC4ViewData>
declare function isLikeC4ViewId(value: unknown): value is LikeC4ViewId

type IconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | undefined
  }
}
declare function RenderIcon(props: IconRendererProps): JSX.Element;

type LikeC4ViewProps = LikeC4ViewBaseProps<LikeC4ViewId, LikeC4Tag, LikeC4ElementKind>;
declare function LikeC4View({viewId, ...props}: LikeC4ViewProps): JSX.Element;

export {
  type LikeC4ViewId,
  type LikeC4Tag,
  type LikeC4ElementKind,
  type LikeC4ViewData,
  type LikeC4DiagramView,
  type LikeC4ViewProps,
  LikeC4Views,
  isLikeC4ViewId,
  RenderIcon,
  LikeC4View
}
/* prettier-ignore-end */
`.trimStart()
  )

  consola.box(
    stripIndent(`
    ${k.dim('Component generated:')}
      ${relative(cwd(), outfilepath)}

    ${k.dim('How to use:')}
     ${k.blue('https://likec4.dev/tooling/codegen/#react')}
  `)
  )

  timer.stopAndLog()
}
