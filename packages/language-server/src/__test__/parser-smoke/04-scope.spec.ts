import { describe } from 'vitest'
import { test } from './asserts'

describe('scope', () => {
  test('valid').valid`
    specification {
      element person
      element component
    }
    model {
      person user
      component system {
        component subsystem {
          -> backend
        }
        backend = component {
          api = component 'API'
        }
        user -> api
      }
    }`

  test('fail if duplicate name in scope').invalid`
    specification {
      element person
      element component
    }
    model {
      person user
      component system {
        component subsystem {
        }
        backend1 = component {
          api = component 'API 1'
        }
        backend2 = component {
          api = component 'API 2'
        }
        user -> api
      }
    }`
})
