import { Graphviz } from '@hpcc-js/wasm/graphviz'
import type { ComputedView, DiagramView } from '@likec4/core/types'
import { dotLayoutFn } from '@likec4/layouts'
import c from 'chalk'

export async function layoutViews(views: ComputedView[]) {
  try {
    const diagrams = [] as DiagramView[]
    const graphviz = await Graphviz.load()
    for (const view of views) {
      console.debug(`\tview: ${view.id}`)
      diagrams.push(dotLayoutFn(graphviz, view))
    }
    return diagrams
  } catch (error) {
    console.error(c.red('⛔️ Fail'))
    console.error(error)
    throw error
  } finally {
    Graphviz.unload()
  }
}
