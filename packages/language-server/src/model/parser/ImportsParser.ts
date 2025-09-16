import { type ProjectId, nonNullable } from '@likec4/core'
import { loggable } from '@likec4/log'
import type { ast } from '../../ast'
import { serverLogger } from '../../logger'
import type { Base } from './Base'

const logger = serverLogger.getChild('ImportsParser')

export function ImportsParser<TBase extends Base>(B: TBase) {
  return class ImportsParser extends B {
    parseImports() {
      const imports = this.doc.parseResult.value.imports ?? []
      for (const importsFromPoject of imports) {
        const project = importsFromPoject.project as ProjectId
        let imported = importsFromPoject.imports as ast.Imported | undefined
        while (imported) {
          try {
            this.doc.c4Imports.set(
              project,
              this.resolveFqn(
                nonNullable(imported.imported.ref, `ElementRef is empty of imported: ${imported.imported.$refText}`),
              ),
            )
          } catch (e) {
            logger.warn(loggable(e))
          }
          imported = imported.prev
        }
      }
    }
  }
}
