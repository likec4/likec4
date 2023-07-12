import { describe } from 'vitest'
import { test } from './asserts'

describe('01-Specification', () => {
  test('valid').valid`
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

  test('valid with uppercase').valid`
    specification {
      element Container
      element softwareSystem
    }`

  test('fail if starts with number').invalid`
    specification {
      element 1container
    }`

  test('allow element with kind "element"').valid`
      specification {
        element element
        element component
      }
  `

  test('kind with style').valid`
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

  test('kind the same name as color').valid`
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

  test('kind the same name as shape').valid`
    specification {
      element storage {
        style {
          shape storage
        }
      }
    }
    `
})
