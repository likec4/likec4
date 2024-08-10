import { describe, vi } from 'vitest'
import { test } from './asserts'

describe.concurrent('scope', () => {
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

  test('valid for elements with names "aws"/"azure"/"tech"').valid`
    specification {
      element component
      element element
    }
    model {
      system = component {
        aws = element {
          rds = element 'RDS'
        }
        azure = element
        tech = element {
          nodejs = element 'Node.js'
        }
      }
      azure -> aws.rds
      tech.nodejs -> aws.rds
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
