import { filter, isString, isTruthy, pipe, unique } from 'remeda'
import type { ComputedView } from '../../model'

export function generateIconRendererSource(views: ComputedView[]) {
  const icons = pipe(
    views.flatMap(v => v.nodes.map(n => n.icon)),
    filter(isString),
    filter(s => isTruthy(s) && !s.toLowerCase().startsWith('http')),
    unique(),
  ).sort()

  const {
    imports,
    cases,
  } = icons.reduce((acc, s, i) => {
    const [group, icon] = s.split(':') as ['aws' | 'azure' | 'gcp' | 'tech', string]

    const Component = 'Icon' + i.toString().padStart(2, '0')

    acc.imports.push(`import ${Component} from 'likec4/icons/${group}/${icon}'`)
    acc.cases.push(`  '${group}:${icon}': ${Component}`)
    return acc
  }, {
    imports: [] as string[],
    cases: [] as string[],
  })
  return `
${imports.join('\n')}

export const Icons = {
${cases.join(',\n')}
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    const update = md.Icons
    if (update) {
      if (!import.meta.hot.data.icons) {
        import.meta.hot.data.icons = Icons
      }
      Object.assign(import.meta.hot.data.icons, update)
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`
}
