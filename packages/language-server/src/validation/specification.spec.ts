import { describe } from 'vitest'
import { testFileScope as it } from '../test'

describe('specification checks', () => {
  it('specification rule checks', async ({ expect, validate }) => {
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

  it('model rule checks', async ({ expect, validate }) => {
    const { errors, warnings } = await validate(`
      specification {}
      model {}
      model {}
      views {}
    `)
    expect(errors).to.be.empty
    expect(warnings).to.have.members(['Prefer one model per document'])
  })

  it('elementKindChecks: unique in one document', async ({ expect, validate }) => {
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

  it('elementKindChecks is not reserved word', async ({ expect, validate }) => {
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

  it('elementKindChecks: unique across documents', async ({ expect, t }) => {
    await t.parse(`
      specification {
        element component
        element user
      }
    `)
    await t.parse(`
      specification {
        element user
      }
    `)

    const { diagnostics } = await t.validateAll()
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate element kind \'user\'')
    }
  })

  it('deploymentNodeKindChecks: unique in one document', async ({ expect, validate }) => {
    const { diagnostics } = await validate(`
      specification {
        deploymentNode component
        deploymentNode user
        deploymentNode component
      }
    `)
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate deploymentNode kind \'component\'')
    }
  })

  it('deploymentNodeKindChecks is not reserved word', async ({ expect, validate }) => {
    const { diagnostics } = await validate(`
    specification {
      deploymentNode this
    }
  `)
    expect(diagnostics).toHaveLength(1)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Reserved word: this')
    }
  })

  it('deploymentNodeKindChecks: unique across documents', async ({ expect, t }) => {
    await t.parse(`
      specification {
        deploymentNode component
        deploymentNode user
      }
    `)
    await t.parse(`
      specification {
        deploymentNode user
      }
    `)

    const { diagnostics } = await t.validateAll()
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate deploymentNode kind \'user\'')
    }
  })

  it('tagChecks: unique in one document', async ({ expect, validate }) => {
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

  it('tagChecks: unique across documents', async ({ expect, t }) => {
    await t.parse(`
      specification {
        tag tag1
        tag tag2
      }
    `)
    await t.parse(`
      specification {
        tag tag1
      }
    `)

    const { diagnostics } = await t.validateAll()
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate tag \'tag1\'')
    }
  })

  it('relationshipChecks: unique in one document', async ({ expect, validate }) => {
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

  it('relationshipChecks: unique across documents', async ({ expect, t }) => {
    await t.parse(`
      specification {
        relationship async
        relationship foo
      }
    `)
    await t.parse(`
      specification {
        relationship async
      }
    `)

    const { diagnostics } = await t.validateAll()
    expect(diagnostics).toHaveLength(2)
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity, 'diagnostic severity').toBe(1)
      expect(diagnostic.message, 'diagnostic message').toBe('Duplicate RelationshipKind \'async\'')
    }
  })
  it('relationshipChecks is not reserved', async ({ expect, validate }) => {
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
