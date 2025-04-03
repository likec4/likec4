import type { Base } from './Base'

export function ImportsParser<TBase extends Base>(B: TBase) {
  return class ImportsParser extends B {
    parseImports() {
      // const { parseResult, c4Globals } = this.doc
    }
  }
}
