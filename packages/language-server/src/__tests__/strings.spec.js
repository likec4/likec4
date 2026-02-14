import { describe } from 'vitest';
import { test } from './asserts';
describe('strings', () => {
    test('valid single line').valid `
    specification {
      element el1 {
        technology "container"
      }
      element el2 {
        technology 'container'
      }
    }
  `;
    test('valid multi-line').valid `
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
  `;
    test('valid multi-line with escaped quotes').valid `
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

    `;
    test('valid multi-line with triple quotes').valid `
    specification {
      element element
    }
    model {
      element el1 {
        description '''
          tech container
        '''
      }
      element el2 {
        description """
          tech container
        """
      }
    }
  `;
});
