import { describe, test, vi } from 'vitest'
import { invalid, valid } from './asserts'

vi.mock('../logger')

describe('model relation', () => {
  test(
    'valid',
    valid`
      specification {
        element person
      }
      model {
        person user1
        person user2
        user1 -> user2
      }
      `
  )

  test(
    'fail if defined in model without source',
    invalid`
      specification {
        element person
      }
      model {
        person user1
        -> user1
      }`
  )

  test(
    'fail if defined in model with it',
    invalid`
      specification {
        element person
      }
      model {
        person user1
        it -> user1
      }`
  )

  test(
    'fail if defined in extend without source',
    invalid`
      specification {
        element person
      }
      model {
        person user1
        person user2
        extend user1 {
          -> user2
        }
      }`
  )

  test(
    'valid 2',
    valid`
      specification {
        element person
      }
      model {
        person user1
        person user2 {
          -> user1
        }
      }`
  )

  test(
    'valid 3',
    valid`
      specification {
        element person
      }
      model {
        person user1 {
          -> user2
        }
        person user2
      }`
  )

  test(
    'valid 4',
    valid`
      specification {
        element person
        element component
      }
      model {
        person user
        component system {
          component subsystem {
            it -> api
          }
          backend = component {
            api = component 'API' {
              -> user
            }
            this -> subsystem
          }
        }
        user -> api
      }`
  )

  test(
    'relation with title',
    valid`
      specification {
        element person
      }
      model {
        person user1
        person user2 {
          -> user1 'calls'
        }
        user1 -> user2 'responds to'
      }`
  )

  test(
    'relation with tags',
    valid`
      specification {
        element person
        tag next
      }
      model {
        person user1
        person user2 {
          -> user1 #next
        }
        user1 -> user2 'responds to' {
          #next
        }
      }`
  )

  test(
    'relation with properties',
    valid`
    specification {
      element person
    }
    model {
      person user1
      person user2 {
        -> user1 {
          title 'calls'
        }
      }
      user1 -> user2 'responds to' {
        title: 'some description';
      }
    }`
  )

  test(
    'relation with property and links',
    valid`
    specification {
      element person
    }
    model {
      person user1
      person user2 {
        -> user1 {
          title 'calls'
          link https://path
        }
      }
    }`
  )

  test(
    'relationship with kind',
    valid`
    specification {
      element person
      relationship async {
        color red
        line dotted
        head normal
        tail normal
      }
    }
    model {
      person user1
      person user2
      person user3
      user1 -> user2
      user1 -[async]-> user3
    }`
  )

  test(
    'relationship with style',
    valid`
    specification {
      element person
    }
    model {
      person user1
      person user2
      user1 -> user2 {
        style {
          color red
          line dotted
          head normal
          tail none
        }
      }
    }`
  )
})
