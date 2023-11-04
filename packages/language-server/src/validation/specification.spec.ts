import { expect, test, vi } from 'vitest'
import { createTestServices } from '../test'

vi.mock('../logger')

const { validate } = createTestServices()

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

test('elementKindChecks', async () => {
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
    expect(diagnostic.message, 'diagnostic message').toBe("Duplicate element kind 'component'")
  }
})

test('tagChecks', async () => {
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
    expect(diagnostic.message, 'diagnostic message').toBe("Duplicate tag 'tag1'")
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
    expect(diagnostic.message, 'diagnostic message').toBe("Duplicate RelationshipKind 'async'")
  }
})
