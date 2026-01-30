import type { ProjectId } from '@likec4/core'
import { type ValidationCheck, AstUtils } from 'langium'
import type { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'
import { tryOrLog } from './_shared'

const { getDocument } = AstUtils

export const checkImportsFromPoject = (services: LikeC4Services): ValidationCheck<ast.ImportsFromPoject> => {
  const projects = services.shared.workspace.ProjectsManager
  return tryOrLog((el, accept) => {
    if (!projects.all.includes(el.project as ProjectId)) {
      accept('error', 'Imported project not found', {
        node: el,
        property: 'project',
      })
      return
    }
    const doc = getDocument(el)
    const projectId = projectIdFrom(doc)
    if (el.project === projectId) {
      accept('error', 'Imported project cannot be the same as the current project', {
        node: el,
        property: 'project',
      })
      return
    }
  })
}

// export const checkImported = (services: LikeC4Services): ValidationCheck<ast.Imported> => {
//   const fqnIndex = services.likec4.FqnIndex
//   const projects = services.shared.workspace.ProjectsManager
//   return tryOrLog((el, accept) => {
//     const doc = getDocument(el)
//     const importFromProject = el.$container.project as ProjectId
//     if (importFromProject === projectId || !projects.all.includes(importFromProject)) {
//       accept('error', 'Invalid import', {
//         node: el,
//       })
//       return
//     }
//     const fqn = fqnIndex.byFqn(importFromProject, el.element.$refText as Fqn).head()
//     if (!fqn) {
//       accept('error', `Imported element not found in project "${importFromProject}"`, {
//         node: el,
//       })
//       return
//     }
//   })
// }
