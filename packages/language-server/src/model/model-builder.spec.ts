import { ValidationResult, expectFunction, expectNoIssues, parseHelper } from 'langium/test'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestLanguageServices } from '../test'
import { isValidDocument } from '../ast'
import type { LikeC4AstType } from '../generated/ast'

expectFunction((actual, expected, message) => {
  expect(actual, message).toEqual(expected)
})

const services = createTestLanguageServices()
const parse = parseHelper(services)
const validate = async (text: string) => {
  const document = await parse(text)
  await services.shared.workspace.DocumentBuilder.build([document], { validationChecks: 'all' })
  return {
    document,
    diagnostics: document.diagnostics!
  }
}

const builder = services.likec4.ModelBuilder

describe('LikeC4ModelBuilder', () => {

  it('builds model', async () => {
    const validationResult = await validate(`
    specification {
      element component
      element user
      tag deprecated
    }
    model {
      user client {
        -> frontend
      }
      component system {
        backend = component 'Backend'
        component frontend {
          #deprecated
          -> backend 'requests'
        }
      }
    }
    `)
    expectNoIssues(validationResult)
    const model = builder.buildModel()
    expect(model).toBeDefined()
    expect(model).toMatchSnapshot()
  })

})
