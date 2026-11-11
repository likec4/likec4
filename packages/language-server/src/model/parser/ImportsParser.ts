import { type Fqn, type ProjectId, nonNullable } from '@likec4/core'
import type { ast } from '../../ast'
import type { Base } from './Base'

export function ImportsParser<TBase extends Base>(B: TBase) {
  return class ImportsParser extends B {
    parseImports() {
      const imports = this.doc.parseResult.value.imports ?? []
      for (const importsFromPoject of imports) {
        // Import name as written in `from '…'`, it is the project id in the consumer model.
        // The imported project is resolved by DependencyResolver when the model is built.
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
            this.logError(e, imported, 'imports')
          }
          imported = imported.prev
        }
      }
    }
  }
}
