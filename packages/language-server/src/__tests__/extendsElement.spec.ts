import { expect, test } from 'vitest'
import { createTestServices } from '../test'

const document1 = `
specification {
  element component
  tag tag1
  tag tag2
}
model {
  component system {
    sub = component {
      component sub1
    }
  }
  component system2
}
`
const document2 = `
model {
  extend system.sub {
    #tag1
    component sub2 {
      -> sub1
    }
  }
}
`
const document3 = `
model {
  system.sub1 -> system.sub2

  extend system.sub.sub2 {
    #tag2
    sub2 -> system2
  }
}
`

test('parser smoke: ExtendsElement Scope', async () => {
  const { parse, validateAll } = createTestServices()
  await parse(document1)
  await parse(document2)
  await parse(document3)

  const { errors } = await validateAll()

  expect(errors).toEqual([])
})
