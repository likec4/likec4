import { type ProjectId, nonNullable } from '@likec4/core'
import { logWarnError } from '../../logger'
import type { Base } from './Base'

export function ImportsParser<TBase extends Base>(B: TBase) {
  return class ImportsParser extends B {
    parseImports() {
      const imports = this.doc.parseResult.value.imports ?? []
      for (const imported of imports.flatMap(i => i.imports)) {
        try {
          this.doc.c4Imports.add(
            imported.$container.project as ProjectId,
            this.resolveFqn(
              nonNullable(imported.element.ref, `ElementRef is empty of imported: ${imported.$cstNode?.text}`),
            ),
          )
        } catch (e) {
          logWarnError(e)
        }
      }
    }
  }
}
