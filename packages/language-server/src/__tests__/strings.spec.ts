import { describe } from 'vitest'
import { test } from './asserts'

describe.concurrent('strings', () => {
  test('valid single line').valid`
    specification {
      element el1 {
        technology "container"
      }
      element el2 {
        technology 'container'
      }
    }
  `

  test('valid multi-line').valid`
    specification {
      element el1 {
        technology "
          container
        "
      }
      element el2 {
        technology '
          container
        '
      }
    }
  `

  test('valid multi-line with escaped quotes').valid`
    specification {
      element el1 {
        technology "
          tech \\"container\\"
        "
      }
      element el2 {
        technology '
          tech \\'container\\'
        '
      }
    }
  `
})
