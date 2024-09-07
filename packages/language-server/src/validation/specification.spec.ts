import { afterEach, describe, it } from 'vitest'
import { createTestServices } from '../test'

describe('specification checks', () => {
  const { validate, parse, validateAll, resetState } = createTestServices()

  afterEach(async () => {
    await resetState()
  })

  it('specification rule checks', async ({ expect }) => {
    const { warnings, errors } = await validate(`
    specification {
      element component
    }
    specification {
      element component2
    }
    model {}
    views {}
  `)
    expect(errors).to.be.empty
    expect(warnings).to.have.members(['Prefer one specification per document'])
  })

  it('model rule checks', async ({ expect }) => {
    const { errors, warnings } = await validate(`
    specification {}
    model {}
    model {}
    views {}
  `)
    expect(errors).to.be.empty
    expect(warnings).to.have.members(['Prefer one model per document'])
  })

  it('views rule checks', async ({ expect }) => {
    const { errors, warnings } = await validate(`
    specification {}
    views {}
    views {}
    views {}
  `)
    expect(errors).to.be.empty
    expect(warnings).to.have.members([
      'Prefer one views block per document',
      'Prefer one views block per document'
    ])
  })

  it('elementKindChecks in one doc', async ({ expect }) => {
    const { diagnostics } = await validate(`
    specification {
      element component
      element user
      element component
    }
  `)
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate element kind \'component\'')
    }
  })

  it('elementKindChecks is not reserved word', async ({ expect }) => {
    const { diagnostics } = await validate(`
    specification {
      element this
    }
  `)
    expect(diagnostics).toHaveLength(1)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Reserved word: this')
    }
  })

  it('elementKindChecks among docs', async ({ expect }) => {
    await parse(`
    specification {
      element component
      element user
    }
  `)
    await parse(`
    specification {
      element user
    }
  `)

    const { diagnostics } = await validateAll()
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate element kind \'user\'')
    }
  })

  it('tagChecks in one doc', async ({ expect }) => {
    const { diagnostics } = await validate(`
    specification {
      tag tag1
      tag tag2
      tag tag1
    }
  `)
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate tag \'tag1\'')
    }
  })

  it('tagChecks among docs', async ({ expect }) => {
    await parse(`
    specification {
      tag tag1
      tag tag2
    }
  `)
    await parse(`
    specification {
      tag tag1
    }
  `)

    const { diagnostics } = await validateAll()
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate tag \'tag1\'')
    }
  })

  it('relationshipChecks', async ({ expect }) => {
    const { diagnostics } = await validate(`
    specification {
      relationship async
      relationship foo
      relationship async
    }
  `)
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate RelationshipKind \'async\'')
    }
  })
  it('relationshipChecks is not reserved', async ({ expect }) => {
    const { diagnostics } = await validate(`
    specification {
      relationship this
    }
  `)
    expect(diagnostics).toHaveLength(1)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Reserved word: this')
    }
  })
})
