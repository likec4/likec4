import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ComputedView } from '../../model'

export function diagramPreviewsSources(views: ComputedView[], assetsDir: string) {
  const {
    imports,
    cases,
  } = views.reduce((acc, { id }, i) => {
    const filePath = resolve(assetsDir, `${id}.png`)
    if (!existsSync(filePath)) {
      return acc
    }
    const Component = 'Png' + i.toString().padStart(2, '0')

    acc.imports.push(`import ${Component} from 'likec4/previews/${id}.png'`)
    acc.cases.push(`  ${JSON.stringify(id)}: ${Component}`)
    return acc
  }, {
    imports: [] as string[],
    cases: [] as string[],
  })
  return `
import { atom, useStore } from 'likec4/vite-plugin/internal'
// assets dir: ${assetsDir}

${imports.join('\n')}

const Previews = {
${cases.join(',\n')}
}

export let $previews = atom(Previews)

export let usePreviewUrl = (id) => {
  const views = useStore($previews, {
    keys: [id]
  })
  return views[id] ?? null
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    const update = md.$previews
    if (update) {
      if (!import.meta.hot.data.$current) {
        import.meta.hot.data.$current = $previews
      }
      const oldKeys = new Set([...Object.keys(import.meta.hot.data.$current.get())])
      for (const [id, view] of Object.entries(update.get())) {
        oldKeys.delete(id)
        import.meta.hot.data.$current.setKey(id, view)
      }

      for (const key of oldKeys.values()) {
        import.meta.hot.data.$current.setKey(key, undefined)
      }
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`
}
