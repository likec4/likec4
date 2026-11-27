import type { AppViteOptions } from './config-app'
import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import k from 'tinyrainbow'
import { build } from 'vite'
import { appViteConfig } from './config-app'
import { copyUserPublicDir, mkTempPublicDir } from './utils'
import { buildWebcomponent as buildWebcomponentBundle } from './webcomponent'

export type BuildAppOptions = AppViteOptions & {
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

const FaviconMimeByExt: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
}

/**
 * Makes the `--output-single-file` build truly self-contained: rewrites the
 * favicon `<link rel="icon" href="…">` in `index.html` to a base64 data URI.
 *
 * Vite intentionally does not inline favicons (and `vite-plugin-singlefile`
 * only inlines `<script>`/`<style>`), so the link stays an external reference
 * to a hashed asset — which the subsequent `removeAllButPreserved` cleanup then
 * deletes, leaving a dangling reference that 404s. Inlining the asset here, just
 * before cleanup, keeps the single HTML file portable.
 *
 * Operates on likec4's own generated `index.html`, which has a single
 * `<link rel="icon">`. No-op when there is no such link, the href is remote
 * (`http(s)`/`//`) or already a `data:` URI, or the referenced file is missing.
 */
export function inlineSingleFileFavicon(outDir: string): void {
  const indexHtml = resolve(outDir, 'index.html')
  if (!existsSync(indexHtml)) {
    return
  }
  const html = readFileSync(indexHtml, 'utf8')

  const linkTag = /<link\b[^>]*\brel=(["'])icon\1[^>]*>/i.exec(html)?.[0]
  if (!linkTag) {
    return
  }
  const hrefPattern = /\bhref=(["'])([^"']*)\1/i
  const href = hrefPattern.exec(linkTag)?.[2]
  if (!href || href.startsWith('data:') || /^(https?:)?\/\//i.test(href)) {
    return
  }

  const assetPath = resolve(outDir, href.replace(/^\.?\//, ''))
  if (!existsSync(assetPath)) {
    return
  }
  const mime = FaviconMimeByExt[extname(assetPath).toLowerCase()] ?? 'application/octet-stream'
  const dataUri = `data:${mime};base64,${readFileSync(assetPath).toString('base64')}`

  const inlinedTag = linkTag.replace(hrefPattern, (_m, quote: string) => `href=${quote}${dataUri}${quote}`)
  writeFileSync(indexHtml, html.replace(linkTag, inlinedTag))
}

/**
 * Runs the production Vite build of the LikeC4 static site into the configured
 * `outDir`: validates the project's views, optionally builds the web-component
 * bundle (skipped for single-file output), and emits the app. For
 * `--output-single-file` it inlines the favicon and strips the temporary Vite
 * assets, leaving a self-contained `index.html` (also copied to `404.html`).
 */
export async function buildApp({
  buildWebcomponent = true,
  outputSingleFile,
  userPublicDir,
  ...cfg
}: BuildAppOptions) {
  const languageServices = cfg.likec4
  const { config, customLogger, outDir, base, webcomponentPrefix } = appViteConfig({
    ...cfg,
    outputSingleFile,
  })

  const outDirWasEmpty = !existsSync(outDir) || readdirSync(outDir).length === 0

  const publicDir = await mkTempPublicDir()

  const userPublicEntries = userPublicDir
    ? await copyUserPublicDir(userPublicDir, publicDir)
    : []

  for (const asset of Assets) {
    const origin = resolve(cfg.app.assetsDir, asset)
    if (existsSync(origin)) {
      copyFileSync(origin, resolve(publicDir, asset))
    }
  }

  const projects = languageServices.languageServices.projects()

  if (projects.length === 1) {
    const computed = await languageServices.viewsService.computedViews()
    const model = await languageServices.layoutedModel()
    const diagrams = [...model.views()].map(vm => vm.$layouted)
    if (diagrams.length === 0) {
      process.exitCode = 1
      throw new Error('no views found')
    }
    if (diagrams.length === computed.length) {
      customLogger.info(`${k.dim('workspace:')} ${k.green(`✓ all views layouted`)}`)
    } else {
      customLogger.warn(
        `${k.dim('workspace:')} ${k.yellow(`✗ layouted ${diagrams.length} of ${computed.length} views`)}`,
      )
    }

    diagrams.forEach(view => {
      const hasLayoutDrift = view.hasLayoutDrift || (!!view.drifts && view.drifts.length > 0)
      if (hasLayoutDrift) {
        customLogger.warn(
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
        customLogger.warn(
          k.dim('landingPage:') + ' ' + k.yellow('no views match the configured filter'),
        )
      }
    }
  } else {
    for (const project of projects) {
      const computed = await languageServices.viewsService.computedViews(project.id)
      if (computed.length === 0) {
        customLogger.warn(`${k.dim('project:')} ${project.id} ${k.yellow(`✗ no views found`)}`)
      } else {
        customLogger.info(`${k.dim('project:')} ${project.id} ${k.green(`${computed.length} views`)}`)
      }

      const model = await languageServices.layoutedModel(project.id)
      const diagrams = [...model.views()].map(vm => vm.$layouted)
      const landingPage = project.config.landingPage
      if (landingPage && ('include' in landingPage || 'exclude' in landingPage)) {
        const patterns = 'include' in landingPage ? landingPage.include : landingPage.exclude
        const hasMatch = diagrams.some(v =>
          patterns.some(p => p.startsWith('#') ? v.tags?.some(t => t === p.slice(1)) : v.id === p)
        )
        if (!hasMatch) {
          customLogger.warn(
            `${k.dim('project:')} ${project.id} ${k.yellow('landingPage: no views match the configured filter')}`,
          )
        }
      }
    }
  }

  if (buildWebcomponent && !outputSingleFile) {
    await buildWebcomponentBundle({
      app: cfg.app,
      likec4: languageServices,
      webcomponentPrefix,
      outDir: publicDir,
      base,
      customization: cfg.customization,
    })
  }

  // Static website
  await build({
    ...config,
    publicDir,
  })

  if (outputSingleFile) {
    if (!outDirWasEmpty) {
      customLogger.warn(k.yellow('outDir was not empty, skipping cleanup'))
      return
    }
    // Inline the favicon before cleanup removes the asset it references,
    // so the single HTML file stays self-contained (no dangling 404).
    inlineSingleFileFavicon(outDir)
    removeAllButPreserved(outDir, ['index.html', ...userPublicEntries])
  }

  // Copy index.html to 404.html
  const indexHtml = resolve(outDir, 'index.html')
  if (existsSync(indexHtml)) {
    copyFileSync(
      indexHtml,
      resolve(outDir, '404.html'),
    )
  }
}
