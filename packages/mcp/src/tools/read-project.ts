import type { LikeC4LanguageServices } from '@likec4/language-server'

export const readProject = async (
  languageServices: LikeC4LanguageServices,
  params: {
    project?: string | undefined
  },
) => {
  const projects = languageServices.projects()
  const project = params.project ? projects.find(p => p.id === params.project) : projects[0]
  if (!project) {
    return 'Project not found'
  }
  const model = await languageServices.computedModel(project.id)
  const response = [
    `project: ${project.id}`,
    `folder: ${project.folder.toString()}`,
  ]
  if (project.documents) {
    response.push(
      'sources:',
      ...project.documents.map(d => `- ${d.toString()}`),
    )
  }
  response.push(
    '',
    '<specifications>',
  )
  const elementKinds = Object.keys(model.$model.specification.elements)
  if (elementKinds.length > 0) {
    response.push(
      'element kinds:',
      ...elementKinds.map(kind => `- ${kind}`),
      '',
    )
  }
  const relationshipKinds = Object.keys(model.$model.specification.relationships)
  if (relationshipKinds.length > 0) {
    response.push(
      'relationship kinds:',
      ...relationshipKinds.map(kind => `- ${kind}`),
      '',
    )
  }
  const deploymentKinds = Object.keys(model.$model.specification.deployments)
  if (deploymentKinds.length > 0) {
    response.push(
      'deployment node kinds:',
      ...deploymentKinds.map(kind => `- ${kind}`),
      '',
    )
  }
  if (model.allTags().length > 0) {
    response.push(
      'tags:',
      ...model.allTags().map(t => `- ${t}`),
      '',
    )
  }
  response.push(
    '</specifications>',
    '',
  )

  response.push('<elements>')
  for (const el of model.elements()) {
    response.push(
      `- id: ${el.id}`,
      `  kind: ${el.kind}`,
      `  title: "${el.title}"`,
      `  description: "${el.description?.replaceAll('\n', ' ').replaceAll('"', '\'') ?? ''}"`,
      `  tags: ${JSON.stringify(el.tags)}`,
      '',
    )
  }
  response.push(
    '</elements>',
    '',
    '<views>',
  )
  for (const view of model.views()) {
    response.push(
      `- id: ${view.id}`,
      `  viewType: ${view.__}`,
    )
    if (view.viewOf) {
      response.push(`  viewOfElement: ${view.viewOf.id}`)
    }
    response.push(
      `  title: "${view.title}"`,
      `  description: "${view.$view.description?.replaceAll('\n', ' ').replaceAll('"', '\'') ?? ''}"`,
      '',
    )
  }
  response.push(
    '</views>',
  )

  return response.join('\n')
}
