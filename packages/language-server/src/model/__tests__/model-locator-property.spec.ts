import type { DeploymentFqn, Fqn } from '@likec4/core'
import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

const model = `
  specification {
    element system
    deploymentNode node
  }
  model {
    a = system 'A' 'Summary' 'Inline Tech'
    b = system 'B' {
      technology 'Body Tech'
      description 'Body description'
    }
  }
  deployment {
    prod = node 'Production' {
      description 'Prod description'
    }
  }
`

describe('ModelLocator: locate property', () => {
  it('locates a property declared in the element body', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document, errors } = await validate(model)
    expect(errors).toEqual([])
    const text = document.textDocument

    const loc = services.likec4.ModelLocator.locateElement('b' as Fqn, undefined, 'technology')
    expect(loc).not.toBeNull()
    expect(text.getText(loc!.range)).toBe(`technology 'Body Tech'`)

    const desc = services.likec4.ModelLocator.locateElement('b' as Fqn, undefined, 'description')
    expect(text.getText(desc!.range)).toBe(`description 'Body description'`)
  })

  it('locates an inline title, summary and technology', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(model)
    const text = document.textDocument
    const locator = services.likec4.ModelLocator

    expect(text.getText(locator.locateElement('a' as Fqn, undefined, 'title')!.range)).toBe(`'A'`)
    expect(text.getText(locator.locateElement('a' as Fqn, undefined, 'summary')!.range)).toBe(`'Summary'`)
    expect(text.getText(locator.locateElement('a' as Fqn, undefined, 'technology')!.range)).toBe(`'Inline Tech'`)
  })

  it('falls back to the element name when the property is not declared', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(model)
    const locator = services.likec4.ModelLocator

    const withProperty = locator.locateElement('a' as Fqn, undefined, 'description')
    const withoutProperty = locator.locateElement('a' as Fqn)
    expect(withProperty).toEqual(withoutProperty)
    expect(document.textDocument.getText(withoutProperty!.range)).toBe('a')
  })

  it('locates a property of a deployment node', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(model)
    const text = document.textDocument
    const locator = services.likec4.ModelLocator

    const title = locator.locateDeploymentElement('prod' as DeploymentFqn, undefined, 'title')
    expect(text.getText(title!.range)).toBe(`'Production'`)
    const desc = locator.locateDeploymentElement('prod' as DeploymentFqn, undefined, 'description')
    expect(text.getText(desc!.range)).toBe(`description 'Prod description'`)
  })

  it('passes the property through LanguageServices.locate', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(model)

    const loc = services.likec4.LanguageServices.locate({ element: 'b' as Fqn, property: 'technology' })
    expect(document.textDocument.getText(loc!.range)).toBe(`technology 'Body Tech'`)
  })
})
