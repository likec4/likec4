import type { ComputedView, DiagramView } from '@likec4/core'
import { DotLayouter } from '@likec4/layouts'
import { red, grey } from 'kleur/colors'

export async function layoutViews(views: ComputedView[]): Promise<DiagramView[]> {
  const dot = new DotLayouter()
  try {
    const diagrams = [] as DiagramView[]
    for (const view of views) {
      console.debug(grey(`    view: ${view.id}`))
      diagrams.push(await dot.layout(view))
    }
    return diagrams
  } catch (error) {
    console.error(red('⛔️ Fail'))
    console.error(error)
    throw error
  } finally {
    dot.dispose()
  }
}
