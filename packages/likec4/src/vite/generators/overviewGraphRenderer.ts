import type { OverviewGraph } from '@likec4/core'
import JSON5 from 'json5'

export function generateOverviewGraphSource(overview: OverviewGraph) {
  return `
import { nano } from 'likec4/react'

export const $graph = nano.atom(${JSON5.stringify(overview, null, 2)})

export const useOverviewGraph = () => {
  return nano.useStore($graph)
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    const update = md.$graph
    if (update) {
      if (!import.meta.hot.data.graph) {
        import.meta.hot.data.graph = $graph
      }
      import.meta.hot.data.graph.set(update.value)
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`
}
