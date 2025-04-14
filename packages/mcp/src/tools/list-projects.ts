import type { LikeC4LanguageServices } from '@likec4/language-server'

export const listProjects = async (languageServices: LikeC4LanguageServices) => {
  const projects = await languageServices.projects()
  const response = [] as string[]
  for (const project of projects) {
    if (!project.documents) {
      continue
    }
    response.push(
      `<likec4project>`,
      `id: ${project.id}`,
      `folder: ${project.folder.toString()}`,
      'sources:',
      ...project.documents.map(d => `- ${d.toString()}`),
      '',
    )
    try {
      const model = await languageServices.computedModel(project.id)
      const elements = [...model.elements()]
      if (elements.length > 0) {
        response.push(
          'elements:',
          ...elements.flatMap(el => [
            `- id: ${el.id}`,
            `  kind: ${el.kind}`,
            `  title: "${el.title}"`,
            '',
          ]),
          '',
        )
      }
      const views = [...model.views()]
      if (views.length > 0) {
        response.push(
          'views:',
          ...views.flatMap(v => [
            `- id: ${v.id}`,
            `  title: "${v.title}"`,
            '',
          ]),
          '',
        )
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
    }

    response.push(`</likec4project>`)
    // const model = likec4.computedModel(project.id)

    // const elementKinds = Object.keys(model.$model.specification.elements)
    // const relationshipKinds = Object.keys(model.$model.specification.relationships)
    // const deploymentKinds = Object.keys(model.$model.specification.deployments)

    // if (!isEmpty(model.$model.elements)) {
    //   lines.push('\nElements:')
    //   for (const el of model.elements()) {
    //     lines.push(
    //       `- resource: likec4://projects/${project.id}/elements/${el.id}`,
    //       `  kind: ${el.kind}`,
    //       `  name: "${el.title}"`,
    //       `  description: "${el.description?.replaceAll('\n', ' ').replaceAll('"', '\'') ?? ''}"`,
    //       '',
    //     )
    //   }
    // }
    // // if (!isEmpty(model.$model.deployments.elements)) {
    //   lines.push('Elements (deployment model):')
    //   for (const el of model.deployment.elements()) {
    //     lines.push(`- id: ${el.id}`)
    //     lines.push(`  kind: ${el.kind}`)
    //     lines.push(`  title: ${el.title}`)
    //     lines.push(`  description: ${el.description?.replaceAll('\n', ' ') ?? 'no description'}`)
    //   }
    // }

    // if (relationshipKinds.length > 0) {
    //   lines.push('Specification - Relationship Kinds:')
    //   for (const kind of relationshipKinds) {
    //     lines.push(`- ${kind}`)
    //   }
    // }

    // if (deploymentKinds.length > 0) {
    //   lines.push('Specification - Deployment Node Kinds:')
    //   for (const kind of deploymentKinds) {
    //     lines.push(`- ${kind}`)
    //   }
    // }

    // response.push(
    //   `<likec4project>`,
    //   ...lines,
    //   `</likec4project>\n`,
    // )
  }

  if (response.length === 0) {
    response.push(
      `<likec4project>`,
      `id: default`,
      `folder: ${languageServices.workspaceUri.toString()}`,
      `</likec4project>`,
    )
  }

  return response.join('\n')
}
