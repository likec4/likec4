import { expect, test, vi } from 'vitest'
import { createTestServices } from '../test'

vi.mock('../logger')

const document1 = `
specification {
  element component
}
model {
  component system {
    sub = component {
      component sub1
    }
  }
}
views {
  view v1 of system {
    include *
  }
}
`
const document2 = `
views {
  view v2 extends v1 {
    include sub1
  }
}
`
const document3 = `
views {
  view v3 extends v2 {
    exclude sub
  }
}
`

test('parser smoke: ExtendView Scope', async () => {
  const { parse, validateAll } = createTestServices()
  await parse(document1)
  await parse(document2)
  await parse(document3)

  const { errors } = await validateAll()

  expect(errors).toEqual([])
})
