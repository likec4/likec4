import { describe } from 'vitest'
import { test } from './asserts'

describe('05_StrictElementRef', () => {
  test('StrictElementRef').valid`
    specification {
      element component
    }
    model {
      component system {
        component sub1 {
          component sub2
        }
      }
      extend system {
      }
      extend system.sub1 {
      }
      extend system.sub1.sub2 {
      }
    }
    `

  test('StrictElementRefScope invalid').invalid`
    specification {
      element component
    }
    model {
      component system {
        component sub1 {
          component sub2
        }
      }
      extend sub1 {
      }
    }
    `

  test('StrictElementChildRefScope invalid').invalid`
    specification {
      element component
    }
    model {
      component system {
        component sub1 {
          component sub2
        }
      }
      extend system.sub2 {
      }
    }
    `
})
