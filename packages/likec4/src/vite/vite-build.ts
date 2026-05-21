import { copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import k from 'tinyrainbow'
import type { SetOptional } from 'type-fest'
import type { Logger } from 'vite'
import { build } from 'vite'
import { viteConfig } from './config-app'
import type { LikeC4ViteConfig } from './config-app'
import { viteWebcomponentConfig } from './config-webcomponent'
import { copyUserPublicDir, mkTempPublicDir } from './utils'

type Config = SetOptional<LikeC4ViteConfig, 'likec4AssetsDir'> & {
  buildWebcomponent?: boolean
}

export const Assets = ['favicon.ico', 'robots.txt']

/**
 * Removes every top-level entry in `outDir` except the names in `preserved`.
 * Used by the `--output-single-file` build to strip the temporary Vite assets
 * once they have been inlined into `index.html`, while keeping `index.html`
 * itself and any user-provided files (see `--public`).
 */
export function removeAllButPreserved(outDir: string, preserved: readonly string[]): void {
  const keep = new Set<string>(preserved)
  for (const extraFile of readdirSync(outDir).filter(f => !keep.has(f))) {
    rmSync(resolve(outDir, extraFile), { recursive: true })
  }
}

export async function viteBuild({
  buildWebcomponent = true,
  webcomponentPrefix = 'likec4',
  title,
  languageServices,
  likec4AssetsDir,
  outputSingleFile,
  userPublicDir,
  ...cfg
}: Config) {
  likec4AssetsDir ??= await mkdtemp(join(tmpdir(), '.likec4-assets-'))

  const config = await viteConfig({
    ...cfg,
    languageServices,
    likec4AssetsDir,
    webcomponentPrefix,
    title,
    outputSingleFile,
  })

  const outDirWasEmpty = !existsSync(config.build.outDir) || readdirSync(config.build.outDir).length === 0

  const publicDir = await mkTempPublicDir()

  const userPublicEntries = userPublicDir
    ? await copyUserPublicDir(userPublicDir, publicDir)
    : []

  for (const asset of Assets) {
    const origin = resolve(config.root, asset)
    if (existsSync(origin)) {
      copyFileSync(origin, resolve(publicDir, asset))
    }
  }

  const projects = languageServices.languageServices.projects()

  if (projects.length === 1) {
    const computed = await languageServices.viewsService.computedViews()
    const diagrams = await languageServices.diagrams()
    if (diagrams.length === 0) {
      process.exitCode = 1
      throw new Error('no views found')
    }
    if (diagrams.length === computed.length) {
      config.customLogger.info(`${k.dim('workspace:')} ${k.green(`✓ all views layouted`)}`)
    } else {
      config.customLogger.warn(
        `${k.dim('workspace:')} ${k.yellow(`✗ layouted ${diagrams.length} of ${computed.length} views`)}`,
      )
    }

    diagrams.forEach(view => {
      const hasLayoutDrift = view.hasLayoutDrift || (!!view.drifts && view.drifts.length > 0)
      if (hasLayoutDrift) {
        config.customLogger.warn(
          k.dim('view') +
            ' ' +
            k.red(view.id) +
            ' ' +
            k.yellow(`is out of date, layout drift detected`),
        )
      }
    })

    // Validate landingPage config
    const landingPage = projects[0].config.landingPage
    if (landingPage && ('include' in landingPage || 'exclude' in landingPage)) {
      const patterns = 'include' in landingPage ? landingPage.include : landingPage.exclude
      const hasMatch = diagrams.some(v =>
        patterns.some(p => p.startsWith('#') ? v.tags?.some(t => t === p.slice(1)) : v.id === p)
      )
      if (!hasMatch) {
        config.customLogger.warn(
          k.dim('landingPage:') + ' ' + k.yellow('no views match the configured filter'),
        )
      }
    }
  } else {
    for (const project of projects) {
      const computed = await languageServices.viewsService.computedViews(project.id)
      if (computed.length === 0) {
        config.customLogger.warn(`${k.dim('project:')} ${project.id} ${k.yellow(`✗ no views found`)}`)
      } else {
        config.customLogger.info(`${k.dim('project:')} ${project.id} ${k.green(`${computed.length} views`)}`)
      }

      const diagrams = await languageServices.diagrams(project.id)
      const landingPage = project.config.landingPage
      if (landingPage && ('include' in landingPage || 'exclude' in landingPage)) {
        const patterns = 'include' in landingPage ? landingPage.include : landingPage.exclude
        const hasMatch = diagrams.some(v =>
          patterns.some(p => p.startsWith('#') ? v.tags?.some(t => t === p.slice(1)) : v.id === p)
        )
        if (!hasMatch) {
          config.customLogger.warn(
            `${k.dim('project:')} ${project.id} ${k.yellow('landingPage: no views match the configured filter')}`,
          )
        }
      }
    }
  }

  if (buildWebcomponent && !outputSingleFile) {
    const webcomponentConfig = viteWebcomponentConfig({
      webcomponentPrefix,
      languageServices,
      outDir: publicDir,
      base: config.base,
    })
    await build(webcomponentConfig)
  }

  // Static website
  await build({
    ...config,
    customLogger: config.customLogger as Logger,
    publicDir,
    mode: 'production',
  })

  if (outputSingleFile) {
    if (!outDirWasEmpty) {
      config.customLogger.warn(k.yellow('outDir was not empty, skipping cleanup'))
      return
    }
    removeAllButPreserved(config.build.outDir, ['index.html', ...userPublicEntries])
  }

  // Copy index.html to 404.html
  const indexHtml = resolve(config.build.outDir, 'index.html')
  if (existsSync(indexHtml)) {
    copyFileSync(
      indexHtml,
      resolve(config.build.outDir, '404.html'),
    )
  }
}
