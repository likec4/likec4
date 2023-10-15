import { describe, vi } from 'vitest'
import { test } from './asserts'

vi.mock('../logger')

describe('specification', () => {

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

        relationship async {
          color red
          line dotted
          head normal
          tail none
        }
      }
      `

  describe('for element kinds', () => {

    test('valid with uppercase').valid`
      specification {
        element Container
        element softwareSystem
      }`

    test('element kind starts with underscore').valid`
      specification {
        element _container
      }`

    test('fail if element kind starts with number').invalid`
      specification {
        element 1container
      }`

    test('fail if tag starts with number').invalid`
      specification {
        tag 1tag
      }`

    // TODO: fix this
    // test('fail if tag starts with underscore').invalid`
    //   specification {
    //     tag _tag
    //   }`

    test('allow element with kind "element"').valid`
      specification {
        element element
        element component
      }`

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

    test('kind with style with colon and semicolon').valid`
      specification {
        element frontend {
          style {
            shape: browser;
            color secondary;
          }
        }
      }`

    test('kind with icon').valid`
      specification {
        element frontend {
          style {
            icon https://icons.terrastruct.com/dev%2Ftypescript.svg
          }
        }
      }`

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
      }`

    test('tags with dash').valid`
      specification {
        tag epic-123
      }`

    test('fail if element starts with dash').invalid`
      specification {
        element -service
      }`

    test('fail if tag starts with dash').invalid`
      specification {
        tag -gray
      }`
  })

  describe('for relationshipKinds', () => {
    test('spec without relationshipkind attributes').valid`
      specification {
        relationship async
      }`

      test('spec with relationshipkind attributes').valid`
      specification {
        relationship async {
          color red
          line dotted
          head normal
          tail none
        }
      }`

      test('spec with relationshipkind defining only color').valid`
      specification {
        relationship async {
          color red
        }
      }`

      test('spec with relationshipkind defining only line').valid`
      specification {
        relationship async {
          line dotted
        }
      }`

      test('spec with relationshipkind defining only head').valid`
      specification {
        relationship async {
          head normal
        }
      }`

      test('spec with relationshipkind defining only tail').valid`
      specification {
        relationship async {
          tail normal
        }
      }`

      test('spec with invalid relationshipkind color').invalid`
      specification {
        relationship async {
          color foo
        }
      }`

      test('spec with invalid relationshipkind line').invalid`
      specification {
        relationship async {
          line foo
        }
      }`

      test('spec with invalid relationshipkind head').invalid`
      specification {
        relationship async {
          head foo
        }
      }`

      test('spec with invalid relationshipkind tail').invalid`
      specification {
        relationship async {
          tail foo
        }
      }`

      test('fail if relationshipkind starts with dash').invalid`
      specification {
        relationship -async
      }`
  })
  
})
