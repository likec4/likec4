import type { ComputedView, DiagramView } from '@likec4/core'
import { dotLayouter } from '@likec4/layouts'
import pTimeout from 'p-timeout'

export type LayoutFn = (view: ComputedView) => Promise<DiagramView>

let loader: Promise<LayoutFn> | null = null
let dotLayout: LayoutFn | null = null

export async function layoutFn(view: ComputedView): Promise<DiagramView> {
  if (loader) {
    await loader
  }
  if (!dotLayout) {
    loader = dotLayouter()
    dotLayout = await loader
    loader = null
  }
  return await pTimeout(dotLayout(view), {
    milliseconds: 1000
  })
}
