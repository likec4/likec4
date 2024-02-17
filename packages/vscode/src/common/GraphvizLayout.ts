import type { ComputedView, DiagramView as LayoutedView } from '@likec4/core'
import { DotLayouter } from '@likec4/layouts'
import { Logger } from '../logger'

export interface GraphvizLayout {
  layout(view: ComputedView): Promise<LayoutedView>
}

export class WasmGraphvizLayout implements GraphvizLayout {
  private dot: DotLayouter

  constructor() {
    this.dot = new DotLayouter()
  }

  async layout(view: ComputedView): Promise<LayoutedView> {
    Logger.debug(`[WasmGraphvizLayout] layout`)
    const { diagram } = await this.dot.layout(view)
    return diagram
  }
}
