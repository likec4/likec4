import { invariant } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-server'
import { first } from 'remeda'
import { elementResource } from '../utils'

export const readElement = async (
  languageServices: LikeC4LanguageServices,
  params: {
    project?: string | undefined
    id: string
  },
) => {
  const project = params.project
    ? languageServices.projects().find(p => p.id === params.project)
    : first(languageServices.projects())
  invariant(project, 'Project not found')

  const model = await languageServices.computedModel(project.id)
  const element = model.element(params.id)

  return JSON.stringify(elementResource(languageServices, element, project.id))
}
