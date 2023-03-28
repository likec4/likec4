export const valid_03_Relation = `
specification {
  element person
}
model {
  person user1
  person user2
  user1 -> user2
}
`
export const valid_03_Relation2 = `
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
export const valid_03_Relation3 = `
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

export const valid_03_Relation4 = `
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
