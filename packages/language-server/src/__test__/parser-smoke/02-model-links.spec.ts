import { describe, test as viTest} from 'vitest'
import { valid, likec4 } from './asserts'

const spec = `
specification {
  element person
  element component
}`

function test(name: string) {
  return (strings: TemplateStringsArray, ...expr: string[]) => {
    viTest(name, valid`${spec}
      model {
        ${likec4(strings, ...expr)}
      }`)
  }
}

describe('02_Model Links', () => {

  describe('with schema', () => {

    test('https and vscode')`
      component tst1 {
        link https://path
      }
      component tst2 {
        link vscode://path
      }
    `

    test('with colon')`
      component tst1 {
        link: https://path
      }
    `

    test('with domain')`
      component tst1 {
        link https://domain.com/path
      }
    `

    test('with path')`
      component tst1 {
        link https://sub.domain.com/segment1/segment2.html
      }
    `

    test('with query')`
      component tst1 {
        link https://sub.domain.com/segment1/segment2.html?query=1&query2=%20
      }
    `

    test('not interfere with comments')`
      // Here is a comment
      component tst1 {

        // And here is a comment
        link https://sub.domain.com/segment1/segment2.html?query=1&query2=%20
      }
    `

  })

  describe('relative', () => {

    test('from root')`
      component tst2 {
        link /segment1/segment2.html
      }
    `

    test('from root with query')`
      component tst2 {
        link /segment1/segment2.html?query=1&query2=%20
      }
    `

    test('from source')`
      component tst3 {
        link ./segment1/segment2.html
      }
    `
    test('from source to parent')`
      component tst3 {
        link ./../segment1/segment2.html
      }
    `

    test('from source parent')`
      component tst3 {
        link ../segment1/segment2.html
      }
    `

    test('with colon')`
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
