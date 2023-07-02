import { describe, test } from 'vitest'
import { valid } from './asserts'

describe('01-Specification', () => {

  test(
    '01-Specification',
    valid`
specification {
  element container
  element component {
    style {
      shape: rectangle
    }
  }
  element person {
    style {
      shape: person
    }
  }

  tag gray
  tag lightgray
}
`
  )

  test(
    'Allow element with kind "element"',
    valid`
      specification {
        element element
        element component
      }
  `)

  test(
    'ElementKindStyle',
    valid`
specification {
  element frontend {
    style {
      shape browser
      color secondary
    }
  }
  element person {
    style {
      shape: person
    }
  }
}
`
  )
  test(
    'StyleColor',
    valid`
specification {
  element green {
    style {
      color green
    }
  }
  element red {
    style {
      color red
    }
  }
}
`
  )
})
// export const invalid_01_Specification_BuiltinElementKind = `
// specification {
//   element element {
//     style {
//       shape browser
//     }
//   }
// }
// `
