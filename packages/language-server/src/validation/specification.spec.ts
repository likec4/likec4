import { afterEach, expect, test, vi } from 'vitest'
import { createTestServices } from '../test'

const { validate, parse, validateAll, resetState } = createTestServices()

afterEach(async () => {
  await resetState()
  // services.shared.workspace.LangiumDocuments.
})

test('specification rule checks', async () => {
  const { errors } = await validate(`
    specification {
      element component
    }
    specification {
      element component2
    }
    model {}
    views {}
  `)
  expect(errors).to.have.members(['Only one specification per document is allowed'])
})

test('model rule checks', async () => {
  const { errors } = await validate(`
    specification {}
    model {}
    model {}
    views {}
  `)
  expect(errors).to.have.members(['Only one model per document is allowed'])
})

test('views rule checks', async () => {
  const { errors } = await validate(`
    specification {}
    views {}
    views {}
    views {}
  `)
  expect(errors).to.have.members([
    'Only one views block per document is allowed',
    'Only one views block per document is allowed'
  ])
})

test('elementKindChecks in one doc', async () => {
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

test('elementKindChecks is not reserved word', async () => {
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

test('elementKindChecks among docs', async () => {
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

test('tagChecks in one doc', async () => {
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

test('tagChecks among docs', async () => {
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

test('relationshipChecks', async () => {
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
test('relationshipChecks is not reserved', async () => {
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
