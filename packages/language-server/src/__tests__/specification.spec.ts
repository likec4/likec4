import { describe, vi } from 'vitest'
import { test } from './asserts'

describe.concurrent('specification', () => {
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
        element _c1
        element ___c1
      }`

    test('element kind with underscore').valid`
      specification {
        element c_
      }`

    test('element kind with dash').valid`
      specification {
        element c-
      }`

    test('element kind does not start with dash').invalid`
      specification {
        element -kind
      }`

    test('fail if element kind starts with number').invalid`
      specification {
        element 1container
      }`

    test('fail if element kind is "this"').invalid`
      specification {
        element this
      }`

    test('fail if element kind is "it"').invalid`
      specification {
        element it
      }`

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
            border none
            opacity 10%
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

    test('kind the same name as relationship line').valid`
      specification {
        element solid
        element dotted
      }`

    test('fail if element only underscores').invalid`
      specification {
        element __
      }`

    test('fail if element starts with dash').invalid`
      specification {
        element -service
      }`

    test('with technology').valid`
      specification {
        element Container {
          technology "docker"
        }
        element softwareSystem {
          technology: "docker";
        }
      }`

    test('with notation and technology').valid`
      specification {
        element Container {
          technology "docker"
          notation "C4 Container"
        }
      }`

    test('invalid with empty notation').invalid`
      specification {
        element Container {
          notation
          technology "docker"
        }
      }`

    test('with notation, technology and style').valid`
      specification {
        element Container {
          technology "docker"
          notation "C4 Container"
          style {
            shape storage
          }
        }
        // Different order
        element SoftwareSystem {
          technology "docker"
          style {
            shape storage
          }
          notation "C4 Container"
        }
      }`
  })

  describe('for tags', () => {
    test('fail if tag starts with number').invalid`
      specification {
        tag 1tag
      }`

    test('fail if tag only underscores').invalid`
      specification {
        tag __
      }`

    test('fail if tag starts with dash').invalid`
      specification {
        tag -gray
      }`

    test('tags with dash').valid`
      specification {
        tag epic-123
      }`

    test('tag starts with underscore').valid`
      specification {
        tag __epic
      }`

    test('tags with underscore').valid`
      specification {
        tag epic_123
      }`
  })

  describe('for relationshipKinds', () => {
    test('spec without relationshipkind attributes').valid`
      specification {
        relationship async
      }`

    test('spec with the same name as line style').valid`
      specification {
        relationship solid {
          line solid
        }
      }`

    test('spec with relationshipkind attributes').valid`
      specification {
        relationship async {
          color red
          line dotted
          head normal
          tail none
        }
        relationship withdots {
          head dot
          tail odot
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

    test('spec with relationshipkind defining technology').valid`
      specification {
        relationship async {
          technology "http"
        }
      }`

    test('spec with relationshipkind defining technology and notation').valid`
      specification {
        relationship async {
          technology "http"
          notation "HTTP Request"
        }
      }`

    test('spec with custom colors').valid`
      specification {
        relationship async {
          color custom-color
        }
        element person {
          style {
            color custom-color
          }
        }

        color custom-color #00ffff
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

    test('fail if relationshipkind is "this"').invalid`
      specification {
        relationship this
      }`

    test('fail if relationshipkind is "it"').invalid`
      specification {
        relationship it
      }`
  })
})
