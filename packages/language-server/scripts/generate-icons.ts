import { Icons } from '@likec4/icons/all'
import { CompositeGeneratorNode, joinToNode, NL, toString } from 'langium/generate'
import { mkdirSync, writeFileSync } from 'node:fs'

const out = new CompositeGeneratorNode()

const icons = Object.keys(Icons).toSorted()

if (icons.length === 0) {
  console.error('No icons found')
  process.exit(1)
}

out
  .append('export const LibIcons = `likec4lib {')
  .appendNewLine()
  .append('  icons {')
  .appendNewLine()
  .indent({
    indentedChildren: [
      joinToNode(icons, String, {
        appendNewLineIfNotEmpty: true
      })
    ],
    indentation: 4
  })
  .appendNewLineIfNotEmpty()
  .append('  }')
  .appendNewLine()
  .append('}', NL, '`;')
  .appendNewLine()

mkdirSync('src/generated-lib', { recursive: true })
writeFileSync('src/generated-lib/icons.ts', toString(out), 'utf-8')

console.log(`Generated src/generated-lib/icons.ts with ${icons.length} icons`)
