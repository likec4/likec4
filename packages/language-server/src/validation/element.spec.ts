import { expect, test } from 'vitest'
import { createTestServices } from '../test'

const { validate } = createTestServices()

test('elementChecks: ', async () => {
  const { diagnostics } = await validate(`
    specification {
      element component
    }
    model {
      component c1
      component c1
    }
  `)
  expect(diagnostics).toHaveLength(2)
  expect(diagnostics[0].severity).toBe(1)
  expect(diagnostics[0].message).toBe("Duplicate element name c1")
  expect(diagnostics[1].severity).toBe(1)
  expect(diagnostics[1].message).toBe("Duplicate element name c1")
})
