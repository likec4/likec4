import type { DiagramView } from '@likec4/core/types'

import JSON5 from 'json5'
import { mkdirp } from 'mkdirp'
import { join, dirname } from 'node:path/posix'
import {
  CompositeGeneratorNode,
  NL,
  expandToNode,
  joinToNode,
  toString
} from 'langium/lib/generator'

export function generateViewsData(views: DiagramView[]) {
  const out = new CompositeGeneratorNode()
  out
    .append('window.LikeC4Views = {', NL)
    .indent({
      indentation: 2,
      indentedChildren: indent => {
        indent.append(
          joinToNode(views, view => expandToNode`'${view.id}': ${JSON5.stringify(view)}`, {
            separator: ',',
            appendNewLineIfNotEmpty: true
          })
        )
      }
    })
    .append('}', NL, NL)
  return toString(out)
}

type DiagramViewWithSourcePath = DiagramView & { sourcePath: string }

export function generateExportScript(views: DiagramViewWithSourcePath[], outputdir: string) {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
    const puppeteer = require('puppeteer');
    const { readFileSync } = require('node:fs');
    const { writeFile } = require('node:fs/promises');
    const { join } = require('node:path/posix');

    ;(async () => {
  `
    .indent({
      indentation: 2,
      indentedChildren(out) {
        out
        .appendNewLine()
        .appendTemplate`
      console.info('Launch puppeteer...')

      const browser = await puppeteer.launch({headless: 'new'});
      const page = await browser.newPage();
      await page.setViewport({
        width: 1000,
        height: 1000,
        deviceScaleFactor: 2,
      });

      await page.setContent(\`
      <!DOCTYPE html>
      <html lang="en" class="dark" data-theme="dark">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style type="text/css">
            html, body {
              width: 100%;
              height: 100%;
            }
            *,:before,:after {
              box-sizing:border-box;
              outline:none;
              border-width:0;
              border-style:solid;
              border-color:transparent;
              padding:0;
              margin:0;
            }
            body {
              padding: 40px 50px 60px 50px;
            }
            #root {
              padding: 40px;
              background-color: #1C1C1C;
              border-radius: 8px;
              box-shadow: rgba(0, 0, 0, 0.4) 0px 16px 40px;
            }
          </style>
        </head>
        <body>
          <div id="root"></div>
        </body>
      </html>
      \`)

      page.on('console', msg => console.log(msg.text()));
      page.on('error', err => {
        console.error(err)
        process.exit(1)
      });

      console.info('Load scripts...')

      await page.addScriptTag({
        content: readFileSync('puppeteer-page.js').toString(),
        type: 'module'
      })

      console.info('Export:')

      async function exportView(viewId, output, viewport) {
        console.info('  - ' + output)
        await page.setViewport({
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 2
        });
        await page.evaluate((id) => window.renderView(id), viewId)
        await new Promise(resolve => setTimeout(resolve, 50))
        await page.waitForSelector('.konvajs-content')
        await page.screenshot({
          path: output,
          omitBackground: true,
          fullPage: true
        })
      }
    `
          .append(NL, NL)
          .append(
            joinToNode(
              views,
              view => {
                const output = join(outputdir, dirname(view.sourcePath), `${view.id}.png`)
                // TODO: remove side effect
                mkdirp.sync(dirname(output))

                return expandToNode`await exportView('${view.id}', '${output}', {width: ${
                  view.width + 180
                }, height: ${view.height + 180}});`
              },
              {
                appendNewLineIfNotEmpty: true
              }
            )
          )
          .appendNewLine()
          .append('await browser.close();')
      }
    })
    .appendNewLine()
    .append('})();')
    .appendNewLine()

  return toString(out)
}
