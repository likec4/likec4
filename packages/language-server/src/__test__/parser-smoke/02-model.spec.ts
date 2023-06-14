import { describe, test } from 'vitest'
import { valid, invalid } from './asserts'

describe('02_Model', () => {
  test(
    '02_Model_Element',
    valid`
      specification {
        element person
      }
      model {
        person user1
        person user2
      }`
  )

  test(
    '02_Model_Element_2',
    valid`
      specification {
        element person
      }
      model {
        user1 = person
        user2 = person
      }`
  )

  test(
    '02_Model_ElementWithTitle',
    valid`
      specification {
        element person
      }
      model {
        person user1
        user2 = person 'Person2'
        user3 = person
      }`
  )

  test(
    '02_Model_Element_Style',
    valid`
specification {
  element person
}
model {
  user1 = person {
    style {
      shape person
      color secondary
    }
  }
  user2 = person
}
`
  )

  test(
    '02_Model invalid',
    invalid`
specification {
  element person
}
model {
  user = person
  person 'Person2'
}
`
  )

  test(
    '02_Model_NestedElemenets',
    valid`
specification {
  element person
  element system
  element component
}
model {
  person user1
  user2 = person {
  }
  user3 = person 'Person3'
  component system {
    subsystem = component
    backend = component {
      api = component 'API'
    }
  }
}
`
  )

  test(
    '02_Model_NestedElemenets - invalid',
    invalid`
      specification {
        element person
        element component
      }
      model {
        person user1
        component system {
          component 'Subsystem'
          component backend
        }
      }
      `
  )

  test(
    '02_ModelElementProps',
    valid`
      specification {
        element component
        tag one
      }
      model {
        component system {
          #one

          component subsystem {
            title: 'SubSystem'
          }
          component storage {
            title 'Storage'
            style {
              shape: storage
            }
          }
        }
      }`
  )
})
