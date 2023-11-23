import type { LangiumDocument } from 'langium'

export const printDocs = (docs: LangiumDocument[]) =>
  docs.map(d => '  - ' + d.uri.toString(true)).join('\n')

export function queueMicrotask(cb: () => void) {
  return Promise.resolve().then(cb)
}
