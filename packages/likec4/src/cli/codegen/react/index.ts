import { viteReactConfig } from '@/vite/config-react'
import { compareNatural } from '@likec4/core'
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

function toUnion(unionset: Set<string>) {
  const union = [...unionset].sort(compareNatural).map(v => `  | ${JSON.stringify(v)}`)
  if (union.length === 0) {
    union.push('  never')
  }
  return union.join('\n') + ';'
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

  let outfilepath = resolve(languageServices.workspace, 'likec4-views.js')
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

  const ids = toUnion(all.ids)
  const tags = toUnion(all.tags)
  const kinds = toUnion(all.kinds)

  await writeFile(
    resolve(outDir, basename(outfilepath, ext) + (ext === '.mjs' ? '.d.mts' : '.d.ts')),
    `
/* prettier-ignore-start */
/* eslint-disable */

/******************************************************************************
 * This file was generated
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

import type { PropsWithChildren } from 'react'
import type { JSX } from 'react/jsx-runtime'
import type {
  LikeC4ViewProps as GenericLikeC4ViewProps,
  ViewData,
  LikeC4Model,
  ReactLikeC4Props as GenericReactLikeC4Props
} from 'likec4/react'

type LikeC4ViewId =
${ids}

type LikeC4ElementKind =
${kinds}

type LikeC4Tag =
${tags}

type LikeC4ViewData = ViewData<LikeC4ViewId>

/**
 * @deprecated alias, use LikeC4ViewData instead
 */
type LikeC4DiagramView = LikeC4ViewData

declare const LikeC4Views: {
  readonly [K in LikeC4ViewId]: LikeC4ViewData
};
type LikeC4ViewsData = typeof LikeC4Views;
declare function isLikeC4ViewId(value: unknown): value is LikeC4ViewId;

declare const likeC4Model: LikeC4Model.Layouted;
declare function useLikeC4Model(): LikeC4Model.Layouted;
declare function useLikeC4View(viewId: LikeC4ViewId): LikeC4ViewData;
declare function useLikeC4ViewModel(viewId: LikeC4ViewId): LikeC4Model.Layouted.ViewModel;

declare function LikeC4ModelProvider(props: PropsWithChildren): JSX.Element;

type IconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | undefined
  }
}
declare function RenderIcon(props: IconRendererProps): JSX.Element;

type LikeC4ViewProps = GenericLikeC4ViewProps<LikeC4ViewId, LikeC4Tag, LikeC4ElementKind>;
declare function LikeC4View({viewId, ...props}: LikeC4ViewProps): JSX.Element;

type ReactLikeC4Props =
  & Omit<GenericReactLikeC4Props<LikeC4ViewId, LikeC4Tag, LikeC4ElementKind>, 'view' | 'renderIcon'>
  & {
    viewId: LikeC4ViewId
  };
declare function ReactLikeC4({viewId, ...props}: ReactLikeC4Props): JSX.Element;

export {
  type LikeC4ViewId,
  type LikeC4Tag,
  type LikeC4ElementKind,
  type LikeC4ViewData,
  type LikeC4ViewsData,
  type LikeC4DiagramView,
  type LikeC4ViewProps,
  type ReactLikeC4Props,
  isLikeC4ViewId,
  useLikeC4Model,
  useLikeC4View,
  useLikeC4ViewModel,
  likeC4Model,
  LikeC4Views,
  LikeC4ModelProvider,
  LikeC4View,
  RenderIcon,
  ReactLikeC4
}
/* prettier-ignore-end */
`.trimStart()
  )

  consola.box({
    message: stripIndent(`
    ${k.dim('Source generated:')}
      ${relative(cwd(), outfilepath)}

    ${k.dim('How to use:')}
      ${k.underline('https://likec4.dev/tooling/codegen/#react')}
  `).trim(),
    style: {
      padding: 2,
      borderColor: 'green',
      borderStyle: 'rounded'
    }
  })

  timer.stopAndLog()
}
