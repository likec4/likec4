import { describe, vi } from 'vitest'
import { test } from './asserts'

vi.mock('../logger')

describe.concurrent('FqnElementRef', () => {
  test('valid').valid`
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
    }`

  test('fail if has spaces').invalid`
    specification {
      element component
    }
    model {
      component system {
        component sub1 {
          component sub2
        }
      }
      extend system .sub1 {
      }
    }`

  test('not fail if space after dot').valid`
    specification {
      element component
    }
    model {
      component system {
        component sub1 {
          component sub2
        }
      }
      extend system. sub1 {
      }
    }`

  test('fail if head is not a global ref').invalid`
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

  test('fail if not a FQN').invalid`
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
