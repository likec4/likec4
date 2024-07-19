import type { ComputedView } from '@likec4/core'
import { filter, isString, pipe, unique } from 'remeda'

export function generateIconRendererSource(views: ComputedView[]) {
  const icons = pipe(
    views.flatMap(v => v.nodes.map(n => n.icon)),
    filter((s: any): s is string => isString(s) && !!s.match(/^(aws|gcp|tech):/)),
    unique()
  ).sort()

  if (icons.length === 0) {
    return `
export const Icons = {}
`
  }

  const {
    imports,
    cases
  } = icons.reduce((acc, s) => {
    const [group, icon] = s.split(':') as ['aws' | 'gcp' | 'tech', string]

    const Component = [
      group[0]!.toUpperCase(),
      group.substring(1),
      icon[0]!.toUpperCase(),
      icon.substring(1).replaceAll('-', '').replaceAll('_', '')
    ].join('')

    acc.imports.push(`import ${Component} from 'likec4/icons/${group}/${icon}'`)
    acc.cases.push(`  '${group}:${icon}': ${Component}`)
    return acc
  }, {
    imports: [] as string[],
    cases: [] as string[]
  })

  return `
${imports.join('\n')}

export const Icons = {
${cases.join(',\n')}
}`
}
