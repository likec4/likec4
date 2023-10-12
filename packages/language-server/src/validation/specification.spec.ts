import { expect, test, vi } from 'vitest'
import { createTestServices } from '../test'

vi.mock('../logger')

const { validate } = createTestServices()

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
