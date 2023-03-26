export const fixture_03_Relation = `
specification {
  element person
  element component
}
model {
  person user1
  user2 = person
  user1 -> user2
}
`

export const fixture_03_Relation2 = `
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
