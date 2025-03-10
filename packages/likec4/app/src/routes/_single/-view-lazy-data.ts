// import { d2Source } from 'virtual:likec4/d2-sources/default.js'
// import { dotSource, svgSource } from 'virtual:likec4/dot-sources/default.js'
// import { mmdSource } from 'virtual:likec4/mmd-sources/default.js'

const d2Source = (viewId: string) => `d2Source(${JSON.stringify(viewId)})`
const dotSource = (viewId: string) => `dotSource(${JSON.stringify(viewId)})`
const mmdSource = (viewId: string) => `mmdSource(${JSON.stringify(viewId)})`
const svgSource = (viewId: string) => `svgSource(${JSON.stringify(viewId)})`
//

export { d2Source, dotSource, mmdSource, svgSource }
