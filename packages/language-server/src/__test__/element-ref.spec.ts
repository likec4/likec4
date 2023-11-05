import { describe, vi } from 'vitest'
import { test } from './asserts'

vi.mock('../logger')

describe('elementref', () => {
  test('valid elementRef').valid`
    specification {
      element component
    }
    model {
      component user
      component system {
        component sub1 {
          component sub2
        }
      }
      user -> sub1.sub2
      component system2 {
        it -> system.sub2
      }
    }
  `

  test('invalid elementRef').invalid`
    specification {
      element component
    }
    model {
      component user
      component system {
        component sub1 {
          component sub2
        }
      }
      user -> sub2.sub1
    }
  `

  test('fail if has space before dot').invalid`
    specification {
      element component
    }
    model {
      component user
      component system {
        component sub1
      }
      user -> system .sub1
    }`

  test('not fail if space after dot').valid`
    specification {
      element component
    }
    model {
      component user
      component system {
        component sub1
      }
      user -> system. sub1
    }`
})
// test('06_ElementRefScope', invalid`
// specification {
//   element component
// }
// model {
//   component system {
//     component sub1 {
//       component sub2
//     }
//   }
//   extends sub1 {
//   }
// }
// `

// test('06_ElementChildRefScope', invalid`
// specification {
//   element component
// }
// model {
//   component system {
//     component sub1 {
//       component sub2
//     }
//   }
//   extends system.sub2 {
//   }
// }
// `
