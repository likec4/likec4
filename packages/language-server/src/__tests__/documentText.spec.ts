import { describe, expect, it } from 'vitest'
import { createTestServices } from '../test'

describe('LikeC4LanguageServices.documentText', () => {
  it('returns the current in-memory text of a known document', async () => {
    const { addDocument, services } = createTestServices()
    const doc = await addDocument(
      `
        specification {
          element component
        }
      `,
      'model.c4',
    )

    const languageServices = services.likec4.LanguageServices
    const text = languageServices.documentText(doc.uri.toString())

    expect(text).toContain('element component')
  })

  it('returns undefined for an unknown uri', () => {
    const { services } = createTestServices()
    const languageServices = services.likec4.LanguageServices

    expect(languageServices.documentText('file:///does/not/exist.c4')).toBeUndefined()
  })
})
