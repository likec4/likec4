import { describe } from 'vitest'
import { test } from './asserts'

describe('diff keywords', () => {
  test('are valid names where they were valid before').valid`
    specification {
      element component
      color add #add
      color remove #fff
    }
    model {
      diff = component {
        style {
          color add
        }
      }
      add = component
      remove = component
    }
    global {
      predicateGroup remove {
        include *
      }
      styleGroup diff {
        style * {
          color remove
        }
      }
      style add * {
        color add
      }
    }
    views {
      view index {
        global predicate remove
        global style diff
        global style add
      }
    }
  `
})
