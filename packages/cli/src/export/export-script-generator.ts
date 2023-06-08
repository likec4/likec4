import type { DiagramView } from '@likec4/core/types'

import JSON5 from 'json5'
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
    .append('window.LikeC4Views = {',NL)
    .indent({
      indentation: 2,
      indentedChildren: indent => {
        indent.append(
          joinToNode(
            views,
            view =>
              expandToNode`'${view.id}': ${JSON5.stringify(view)}`,
            {
              separator: ',',
              appendNewLineIfNotEmpty: true
            }
          )
        )
      }
    })
    .append('}', NL, NL)
  return toString(out)
}

export function generateExportScript(views: DiagramView[], outputdir: string) {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
    const puppeteer = require('puppeteer');
    const { readFileSync } = require('node:fs');
    const { writeFile } = require('node:fs/promises');
    const { join } = require('node:path/posix');

    ;(async () => {

    console.info('Launch puppeteer...')

    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();
    await page.setViewport({
      width: 1000,
      height: 1000,
      deviceScaleFactor: 2,
      isMobile: false,
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
          *,:before,:after{
            box-sizing:border-box;
            outline:none;
            border-width:0;
            border-style:solid;
            border-color:transparent;
            padding:0;
            margin:0;
          }
        </style>
      </head>
      <body>
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
      content: readFileSync('likec4views.js').toString(),
      type: 'module'
    })

    await page.addScriptTag({
      content: readFileSync('puppeteer-page.js').toString(),
      type: 'module'
    })

    console.info('Export:')

    async function exportView(viewId, viewport) {
      const output = join('${outputdir}', viewId + '.png')
      console.info('  - ' + output)
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 2
      });
      await page.evaluate((id) => window.renderView(id), viewId)
      await new Promise(resolve => setTimeout(resolve, 50))
      await page.waitForSelector('.konvajs-content')
      await writeFile(
        output,
        await page.evaluate(() => window.exportToPngBase64(2)),
        'base64'
      );
    }

  `
    .append(NL, NL)
    .append(
      joinToNode(
        views,
        view =>
          expandToNode`await exportView('${view.id}', {width: ${view.width + 100}, height: ${view.height + 100}});`,
        {
          appendNewLineIfNotEmpty: true
        }
      )
    )
    .appendNewLine()
    .append('await browser.close();', NL, NL)
    .append('})();')
    .appendNewLine()


  return toString(out)
}
