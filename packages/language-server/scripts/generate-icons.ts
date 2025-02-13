import { Icons } from '@likec4/icons/all'
import { CompositeGeneratorNode, joinToNode, toString } from 'langium/generate'
import compareNatural from 'natural-compare-lite'
import { mkdirSync, writeFileSync } from 'node:fs'

const out = new CompositeGeneratorNode()

const icons = Object.keys(Icons).sort(compareNatural)

if (icons.length === 0) {
  console.error('No icons found')
  process.exit(1)
}

out
  .append('export const LibIcons: string = `likec4lib { icons {')
  .appendNewLine()
  .indent({
    indentedChildren: [
      joinToNode(icons, String, {
        appendNewLineIfNotEmpty: true,
      }),
    ],
    indentation: 2,
  })
  .appendNewLineIfNotEmpty()
  .append('}}`;')
  .appendNewLine()

mkdirSync('src/generated-lib', { recursive: true })
writeFileSync('src/generated-lib/icons.ts', toString(out), 'utf-8')

console.info(`Generated src/generated-lib/icons.ts with ${icons.length} icons`)
