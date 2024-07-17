import { globSync } from 'glob'
import { CompositeGeneratorNode, joinToNode, NL, toString } from 'langium/generate'
import { mkdirSync, writeFileSync } from 'node:fs'

const out = new CompositeGeneratorNode()

const icons = globSync(`../icons/src/*/*.tsx`).map(path => {
  const parts = path.split('/')
  const icon = parts.pop()!.replace('.tsx', '')
  const group = parts.pop()!
  return `${group}:${icon}`
}).toSorted()

if (icons.length === 0) {
  console.error('No icons found')
  process.exit(1)
}

// icons.unshift('none')

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
