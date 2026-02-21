import { type ProjectId, nonNullable } from '@likec4/core'
import type { ast } from '../../ast'
import type { Base } from './Base'

export function ImportsParser<TBase extends Base>(B: TBase) {
  return class ImportsParser extends B {
    parseImports() {
      const imports = this.doc.parseResult.value.imports ?? []
      for (const importsFromProject of imports) {
        const project = importsFromProject.project as ProjectId
        let imported = importsFromProject.imports as ast.Imported | undefined
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
