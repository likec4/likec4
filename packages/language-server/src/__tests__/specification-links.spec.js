import { describe } from 'vitest';
import { test } from './asserts';
describe('Model Links', () => {
    describe('with schema', () => {
        test('https and vscode').valid `
      specification {
        element tst1 {
          link https://path
        }
        element tst2 {
          link vscode://path
        }
      }
    `;
        test('with space space').invalid `
      specification {
        element tst1 {
          link https:// path
        }
        element tst2 {
          link http :// path
        }
        element tst3 {
          link http://path / asd
        }
      }
    `;
        test('with colon').valid `
      specification {
        element tst1 {
          link: https://path
        }
      }
    `;
        test('with domain').valid `
      specification {
        element tst1 {
          link https://domain.com/path
        }
      }
    `;
        test('with path').valid `
      specification {
        element tst1 {
          link https://sub.domain.com/segment1/segment2.html
        }
      }
    `;
        test('with dots in path').valid `
      specification {
        element tst1 {
          link https://sub.domain.com/segment1/../segment2.html
        }
      }
    `;
        test('with query').valid `
      specification {
        element tst1 {
          link https://sub.domain.com/segment1/segment2.html?query=1&query2=%20
        }
      }
    `;
        test('with query and hash').valid `
      specification {
        element tst1 {
          link https://sub.domain.com/?query=1&query2=%20#hash
        }
      }
    `;
        test('with title').valid `
      specification {
        element tst1 {
          link https://sub.domain.com/?query=1&query2=%20#hash 'some title'
        }
      }
    `;
        test('not interfere with comments').valid `
      specification {
        // Here is a comment
        element tst1 {

          // And here is a comment
          link https://sub.domain.com/segment1/segment2.html?query=1&query2=%20 // And here
        }
      }
    `;
    });
    describe('relative', () => {
        test('from root').valid `
      specification {
        element tst2 {
          link /segment1/segment2.html
        }
      }
    `;
        test('fail if link contains spaces').invalid `
      specification {
        element tst2 {
          link /segment1 /segment2.html
        }
      }
    `;
        test('with query').valid `
      specification {
        element tst2 {
          link /segment1/segment2.html?query=1&query2=%20
        }
      }
    `;
        test('with query and hash').valid `
      specification {
        element tst2 {
          link /segment1/segment2.html?query=1&query2=%20#hash2
        }
      }
    `;
        test('relative to source').valid `
      specification {
        element tst3 {
          link ./segment1/segment2.html
        }
      }
    `;
        test('fail if only dot').invalid `
      specification {
        element tst3 {
          link .
        }
      }
    `;
        test('fail if space after dot').invalid `
      specification {
        element tst3 {
          link .. /segment1/segment2.html
        }
      }
    `;
        test('from source to parent').valid `
      specification {
        element tst3 {
          link ./../segment1/segment2.html
        }
      }
    `;
        test('to parent').valid `
      specification {
        element tst3 {
          link ../segment1/segment2.html
        }
      }
    `;
        test('to parent-of-parent').valid `
      specification {
        element tst3 {
          link ../../../segment2.html
        }
    }
    `;
        test('with colon').valid `
      specification {
        element tst1 {
          link: ./../segment1/segment2.html
          link: ../segment1/segment2.html
        }
      }
    `;
        test('with semicolon').valid `
      specification {
        element tst1 {
          link ./../segment1/segment2.html;
          link: ../segment1/segment2.html;
        }
      }
    `;
    });
});
