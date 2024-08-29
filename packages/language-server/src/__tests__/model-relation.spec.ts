import { describe, test, vi } from 'vitest'
import { invalid, valid } from './asserts'

describe.concurrent('model relation', () => {
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
        user1 = person "user1" {
        }
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
        person user1 {}
        it -> user1
      }`
  )

  test(
    'fail if defined in model with this',
    invalid`
      specification {
        element person
      }
      model {
        person user1 {}
        this -> user1
      }`
  )

  test(
    'fail if defined in extend without source',
    invalid`
      specification {
        element person
      }
      model {
        person user1 {}
        person user2 {}
        extend user1 {
          -> user2
        }
      }`
  )

  test(
    'fail if defined in extend with this',
    invalid`
      specification {
        element person
      }
      model {
        person user1 {}
        person user2 {}
        extend user1 {
          user2 -> this
        }
      }`
  )

  test(
    'fail if defined in extend with it',
    invalid`
      specification {
        element person
      }
      model {
        person user1 {}
        person user2 {}
        extend user1 {
          it -> user2
        }
      }`
  )

  test(
    'valid it',
    valid`
      specification {
        element person
      }
      model {
        person user1 {
          it -> user2
        }
        person user2
      }`
  )

  test(
    'valid it as target',
    valid`
      specification {
        element person
      }
      model {
        person user1 {
          user2 -> it
        }
        person user2
      }`
  )

  test(
    'valid this',
    valid`
      specification {
        element person
      }
      model {
        person user1 {
          this -> user2
        }
        person user2
      }`
  )

  test(
    'valid this as target',
    valid`
      specification {
        element person
      }
      model {
        person user1 {
          user2 -> this
        }
        person user2
      }`
  )

  test(
    'valid 2',
    valid`
      specification {
        element person
      }
      model {
        person user1 {}
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
        tag one
        tag two
        tag three
      }
      model {
        person user1
        person user2 {
          -> user1 #one #two
        }
        user1 -> user2 'responds to' #one #two, #three
        person user3 {
          -> user2 {
            #one #two, #three;
          }
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
          description 'some description'
        }
      }
      user1 -> user2 'responds to' {
        title: 'some title';
      }
      user2 -> user1 'responds to' {
        technology: 'technology';
        description 'description'
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

  test(
    'relationship with metadata',
    valid`
    specification {
      element component
    }
    model {
      component client
      component server
      client -> server {
        metadata {
          httpVerb 'GET'
          path '/users/:id'
        }
      }
    }`
  )

  test(
    'relationship with technology',
    valid`
    specification {
      element component

      tag asIs
    }
    model {
      component client1
      component client2
      component server

      client1 -> server 'uses' 'graphql' #asIs
      client2 -> server {
        technology 'graphql'
      }
    }`
  )
})
