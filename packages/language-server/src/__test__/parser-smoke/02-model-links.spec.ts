import { describe, test as viTest } from 'vitest'
import { valid, likec4, invalid } from './asserts'

const spec = `
specification {
  element person
  element component
}`

function test(name: string) {
  return {
    valid: (strings: TemplateStringsArray, ...expr: string[]) => {
      viTest.concurrent(
        `valid: ${name}`,
        valid`${spec}
      model {
        ${likec4(strings, ...expr)}
      }`
      )
    },
    invalid: (strings: TemplateStringsArray, ...expr: string[]) => {
      viTest.concurrent(
        `invalid: ${name}`,
        invalid`
      ${spec}
      model {
        ${likec4(strings, ...expr)}
      }`
      )
    }
  }
}

describe.concurrent('02_Model Links', () => {
  describe('with schema', () => {
    test('https and vscode').valid`
      component tst1 {
        link https://path
      }
      component tst2 {
        link vscode://path
      }
    `

    test('with space space').invalid`
      component tst1 {
        link https:// path
      }
      component tst2 {
        link http :// path
      }
      component tst3 {
        link http://path / asd
      }
    `

    test('with colon').valid`
      component tst1 {
        link: https://path
      }
    `

    test('with domain').valid`
      component tst1 {
        link https://domain.com/path
      }
    `

    test('with path').valid`
      component tst1 {
        link https://sub.domain.com/segment1/segment2.html
      }
    `

    test('with dots in path').valid`
      component tst1 {
        link https://sub.domain.com/segment1/../segment2.html
      }
    `

    test('with query').valid`
      component tst1 {
        link https://sub.domain.com/segment1/segment2.html?query=1&query2=%20
      }
    `

    test('not interfere with comments').valid`
      // Here is a comment
      component tst1 {

        // And here is a comment
        link https://sub.domain.com/segment1/segment2.html?query=1&query2=%20 // And here
      }
    `
  })

  describe('relative', () => {
    test('from root').valid`
      component tst2 {
        link /segment1/segment2.html
      }
    `

    test('fail if link contains spaces').invalid`
      component tst2 {
        link /segment1 /segment2.html
      }
    `

    test('from root with query').valid`
      component tst2 {
        link /segment1/segment2.html?query=1&query2=%20
      }
    `

    test('relative to source').valid`
      component tst3 {
        link ./segment1/segment2.html
      }
    `

    test('fail if only dot').invalid`
      component tst3 {
        link .
      }
    `

    test('fail if space after dot').invalid`
      component tst3 {
        link .. /segment1/segment2.html
      }
    `

    test('from source to parent').valid`
      component tst3 {
        link ./../segment1/segment2.html
      }
    `

    test('from source parent').valid`
      component tst3 {
        link ../segment1/segment2.html
      }
    `

    test('with colon').valid`
      component tst1 {
        link: ./../segment1/segment2.html
        link: ../segment1/segment2.html
      }
    `
  })
  // test(
  //   'link with schema',
  //   valid`${spec}
  //     model {
  //       person user1 {
  //         link https://jjjjj
  //       }
  //     }`
  // )

  // test(
  //   'relative link from root',
  //   valid`${spec}
  //   model {
  //     person user1 {
  //       link ./jjjjj
  //     }
  //   }
  // `
  // )
})
