import { globSync } from 'glob'
import { CompositeGeneratorNode, expandToNode, joinToNode, NL, toString } from 'langium/generate'
import { writeFileSync } from 'node:fs'

const out = new CompositeGeneratorNode()

const icons = globSync(`../icons/src/*/*.tsx`).map(path => {
  const parts = path.split('/')
  const icon = parts.pop()!.replace('.tsx', '')
  const group = parts.pop()!
  return [
    group as 'aws' | 'gcp' | 'tech',
    icon,
    [
      group[0]!.toUpperCase(),
      group.substring(1),
      icon[0]!.toUpperCase(),
      icon.substring(1).replaceAll('-', '').replaceAll('_', '')
    ].join('')
  ] as const
}).toSorted((a, b) => a[2].localeCompare(b[2]))

if (icons.length === 0) {
  console.error('No icons found')
  process.exit(1)
}

out
  .append(`import type { ReactNode } from 'react'`, NL)
  .append(
    joinToNode(
      icons,
      ([group, icon, cmp]) => `import ${cmp} from '@likec4/icons/${group}/${icon}'`,
      {
        appendNewLineIfNotEmpty: true
      }
    )
  )
  .append(NL, NL)
  .appendTemplate`
    export type RendererProps = {
      node: {
        id: string
        title: string
        icon?: string | undefined
      }
    }
    export default function IconRenderer({node}: RendererProps): ReactNode {
  `
  .append(NL)
  .append('  switch (node.icon) {')
  .append(NL)
  .indent({
    indentedChildren: [
      joinToNode(
        icons,
        ([group, icon, cmp]) =>
          expandToNode`
          case '${group}:${icon}':
            return <${cmp} />;
        `,
        {
          appendNewLineIfNotEmpty: true
        }
      )
    ],
    indentation: 4
  })
  .appendNewLineIfNotEmpty()
  .append('  }', NL)
  .append(`  console.error(\`Unsupported icon: \${node.icon}\`);`, NL)
  .append(`  return null`, NL)
  .append('}', NL)

writeFileSync('src/generated-icons.tsx', toString(out), 'utf-8')

console.log(`Generated src/generated-icons.tsx with ${icons.length} icons`)
