import type { DeploymentFqn, Fqn } from '@likec4/core'
import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

const precedence = `
  specification {
    element system
    deploymentNode node
    tag one
    tag two
  }
  model {
    c = system 'Inline title' 'Inline summary' 'Inline tech' {
      title 'Body title'
      technology 'Body tech'
    }
    d = system 'D' {
      #one, #two
      descriptionFile ./d.md
    }
    e = system 'E' '' {
      summary 'Body summary'
      metadata {
        owner 'team'
      }
    }
  }
  deployment {
    prod = node 'Inline prod' {
      title 'Body prod'
    }
    stage = node 'Stage' '' {
      summary 'Body stage summary'
    }
  }
`

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

  it('locates the inline value when the body declares the same property', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(precedence)
    const text = document.textDocument
    const locator = services.likec4.ModelLocator

    expect(text.getText(locator.locateElement('c' as Fqn, undefined, 'title')!.range)).toBe(`'Inline title'`)
    expect(text.getText(locator.locateElement('c' as Fqn, undefined, 'technology')!.range)).toBe(`'Inline tech'`)
    const prod = locator.locateDeploymentElement('prod' as DeploymentFqn, undefined, 'title')
    expect(text.getText(prod!.range)).toBe(`'Inline prod'`)
  })

  it('locates descriptionFile for description', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(precedence)

    const loc = services.likec4.ModelLocator.locateElement('d' as Fqn, undefined, 'description')
    expect(document.textDocument.getText(loc!.range)).toBe(`descriptionFile ./d.md`)
  })

  it('locates tags', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(precedence)

    const loc = services.likec4.ModelLocator.locateElement('d' as Fqn, undefined, 'tags')
    expect(document.textDocument.getText(loc!.range)).toBe(`#one, #two`)
  })

  it('locates the body summary when the inline summary is empty', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(precedence)
    const text = document.textDocument
    const locator = services.likec4.ModelLocator

    expect(text.getText(locator.locateElement('e' as Fqn, undefined, 'summary')!.range)).toBe(`summary 'Body summary'`)
    const stage = locator.locateDeploymentElement('stage' as DeploymentFqn, undefined, 'summary')
    expect(text.getText(stage!.range)).toBe(`summary 'Body stage summary'`)
  })

  it('locates metadata', async ({ expect }) => {
    const { validate, services } = createTestServices()
    const { document } = await validate(precedence)

    const loc = services.likec4.ModelLocator.locateElement('e' as Fqn, undefined, 'metadata')
    expect(document.textDocument.getText(loc!.range)).toMatch(/^metadata \{\s+owner 'team'\s+\}$/)
  })
})
