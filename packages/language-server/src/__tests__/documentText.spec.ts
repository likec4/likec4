import { describe } from 'vitest'
import { test as it } from '../test'

describe('LikeC4LanguageServices.documentText', () => {
  it('returns the current in-memory text of a known document', async ({ t, expect }) => {
    const doc = await t.addDocument(
      `
        specification {
          element component
        }
      `,
      'model.c4',
    )

    const languageServices = t.services.likec4.LanguageServices
    const text = languageServices.documentText(doc.uri.toString())

    expect(text).toContain('element component')
  })

  it('returns undefined for an unknown uri', async ({ t, expect }) => {
    const languageServices = t.services.likec4.LanguageServices

    expect(languageServices.documentText('file:///does/not/exist.c4')).toBeUndefined()
  })
})
