import { D } from '@mobily/ts-belt'
import { expect, test } from 'vitest'
import { testServices } from '../test'

const document1 = `
specification {
  element component
}
model {
  component system {
    component sub1
  }
}
`
const document2 = `
model {
  extend system {
    component sub2 {
      -> sub1
    }
  }
}
`
const document3 = `
model {
  system.sub2 -> system.sub1
}
`

test('parser smoke: ExtendsElement Scope', async () => {
  const { addDocument, validate } = testServices()
  addDocument(document1, 'document1')
  addDocument(document2, 'document2')
  addDocument(document3, 'document3')

  const errors = (await validate()).join('\n')

  expect(errors).toEqual('')
  return
})
