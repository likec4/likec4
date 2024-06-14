import { GraphvizLayouter } from './graphviz/GraphvizLayoter'
import { GraphvizWasmAdapter } from './graphviz/wasm'

export { GraphvizLayouter } from './graphviz/GraphvizLayoter'
export { parseGraphvizJson } from './graphviz/GraphvizParser'
export type * from './graphviz/GraphvizParser'
export type * from './graphviz/types'

export const graphvizLayouter = /* @__PURE__ */ new GraphvizLayouter(new GraphvizWasmAdapter())
