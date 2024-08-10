import type { DiagramView } from '@likec4/core'
import { generateReactNext } from '@likec4/generators'
import { consola } from '@likec4/log'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import k from 'picocolors'

export async function writeSources({
  outputDir,
  diagrams
}: {
  outputDir: string
  diagrams: Iterable<DiagramView>
}) {
  const {
    components,
    viewsData,
    index
  } = generateReactNext(diagrams)

  for (const out of [components, viewsData]) {
    let fname = resolve(outputDir, `${out.fileName}.js`)
    await writeFile(fname, out.js)
    consola.debug(`${k.dim('generated')} ${fname}`)

    fname = resolve(outputDir, `${out.fileName}.d.ts`)
    await writeFile(fname, out.dts)
    consola.debug(`${k.dim('generated')} ${fname}`)
  }

  if (existsSync(resolve(outputDir, 'index.ts'))) {
    consola.info(`${k.dim('already exists, skip')} ${resolve(outputDir, 'index.ts')}`)
    return
  }

  let fname = resolve(outputDir, 'index.js')
  if (existsSync(fname)) {
    consola.info(`${k.dim('already exists, skip')} ${fname}`)
    return
  }

  await writeFile(fname, index.js)
  consola.debug(`${k.dim('generated')} ${fname}`)

  fname = resolve(outputDir, 'index.d.ts')
  await writeFile(fname, index.dts)
  consola.debug(`${k.dim('generated')} ${fname}`)
}
