import type { LikeC4LanguageServices } from '@likec4/language-server'

export const searchElement = async (
  languageServices: LikeC4LanguageServices,
  params: {
    search: string
  },
) => {
  const search = params.search.toLowerCase()
  const found = [] as string[]

  for (const project of languageServices.projects()) {
    const model = await languageServices.computedModel(project.id)
    const elements = [...model.elements()].filter(el => el.title.toLowerCase().includes(search))
    if (elements.length > 0) {
      found.push(
        '<project>',
        `project: "${project.id}"`,
        'found:',
        ...elements.flatMap(el => [
          `- id: ${el.id}`,
          `  kind: ${el.kind}`,
          `  title: "${el.title}"`,
          '',
        ]),
        '</project>',
      )
    }
  }
  return found.length > 0 ? found.join('\n') : 'No elements with this name found'
}
