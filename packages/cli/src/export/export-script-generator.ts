import type { DiagramView } from '@likec4/core'

import JSON5 from 'json5'
import { mkdirp } from 'mkdirp'
import process from 'node:process'
import { join, resolve, dirname } from 'node:path'
import { CompositeGeneratorNode, NL, expandToNode, joinToNode, toString } from 'langium'
import builtInPageTemplate from './puppeteer-page/template.html'

const isNoSanbox = 'LIKEC4_NO_SANDBOX' in process.env

type DiagramViewWithSourcePath = DiagramView & { sourcePath: string }

export function generateExportScript({
  views,
  outputdir,
  template = builtInPageTemplate
}: {
  views: DiagramViewWithSourcePath[]
  outputdir: string
  template?: string
}) {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
    /* eslint-disable */

    const puppeteer = require('puppeteer');
    const { readFileSync } = require('fs');
    const { join } = require('path');

    ;(async () => {
  `
    .indent(
      indent =>
        indent.appendNewLine().appendTemplate`
      console.info('Launch puppeteer...')

      const browser = await puppeteer.launch({
        headless: 'new',
        ${
          isNoSanbox
            ? `args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],`
            : ''
        }
      });
      const page = await browser.newPage();
      await page.setViewport({
        width: 1000,
        height: 1000,
        deviceScaleFactor: 2,
      });

      await page.setContent(${JSON5.stringify(template)})

      console.info('Export:')

      async function exportView(diagram, output) {
        try {
          const viewport = await page.evaluate((d) => window.calcRequiredViewport(d), diagram)
          await page.setViewport({
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 2
          });
          await page.evaluate((d) => window.renderLikeC4View(d), diagram)
          await page.waitForSelector('.konvajs-content')
          await page.waitForNetworkIdle({
            idleTime: 200,
            timeout: 5000
          })
          await page.screenshot({
            path: output,
            omitBackground: true,
            fullPage: true
          })
          console.info('  - ' + output)
        } catch (err) {
          console.error(' fail ' + output)
          console.error(err)
        }
      }
    `
          .append(NL, NL)
          .append(
            joinToNode(
              views,
              view => {
                let output = resolve(outputdir, view.sourcePath)
                output = join(dirname(output), `${view.id}.png`)
                // TODO: remove side effect
                mkdirp.sync(dirname(output))
                return expandToNode`
                // render ${view.id}
                await exportView(${JSON5.stringify(view)}, ${JSON.stringify(output)});
              `
              },
              {
                appendNewLineIfNotEmpty: true
              }
            )
          )
          .append(NL).appendTemplate`
           console.info('Closing browser...')
           let tm = setTimeout(() => {
              console.error('Operation Timed out...')
              process.exit(1)
           }, 5000)
           await browser.close();
           clearTimeout(tm);
        `
    )
    .appendNewLine()
    .append('})();')
    .appendNewLine()

  return toString(out)
}
