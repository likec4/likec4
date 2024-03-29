import type { DiagramView } from '@likec4/core'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { generateSources } from './generate-sources'

export async function writeSources({
  outputDir,
  diagrams
}: {
  outputDir: string
  diagrams: Iterable<DiagramView>
}) {
  const src = generateSources(diagrams)
  await writeFile(resolve(outputDir, 'views.js'), src.views.js)
  await writeFile(resolve(outputDir, 'views.d.ts'), src.views.dts)
  await writeFile(resolve(outputDir, 'index.js'), src.index.js)
  await writeFile(resolve(outputDir, 'index.d.ts'), src.index.dts)
}
