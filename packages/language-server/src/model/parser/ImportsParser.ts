import { type ProjectId, nonNullable } from '@likec4/core'
import type { ast } from '../../ast'
import type { LikeC4LangiumDocument } from '../../ast'
import type { Base } from './Base'

/**
 * Yields all imports of the document as pairs of the project ID we import from and `Imported` node.
 *
 * `Imported` nodes of one statement are chained via `prev` (the last one is the head of the chain),
 * so `import { a, b } from 'project'` yields `b` and then `a`.
 */
export function* streamImports(doc: LikeC4LangiumDocument): Generator<[ProjectId, ast.Imported]> {
  const imports = doc.parseResult.value.imports ?? []
  for (const importsFromPoject of imports) {
    const project = importsFromPoject.project as ProjectId
    let imported = importsFromPoject.imports as ast.Imported | undefined
    while (imported) {
      yield [project, imported] as const
      imported = imported.prev
    }
  }
}

export function ImportsParser<TBase extends Base>(B: TBase) {
  return class ImportsParser extends B {
    parseImports() {
      for (const [project, imported] of streamImports(this.doc)) {
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
      }
    }
  }
}
