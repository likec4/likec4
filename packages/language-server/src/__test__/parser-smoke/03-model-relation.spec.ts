import { describe, test } from 'vitest'
import { valid } from './asserts'

describe('03_Relation', () => {
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
}
`
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
}
`
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
}
`
  )

  test(
    'Relation_with_title',
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
}
`
  )

  test(
    'Relation_with_props',
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
    title 'some description'
  }
}
`
  )
})
