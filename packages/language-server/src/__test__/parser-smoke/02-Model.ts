export const fixture_02_Model = `
specification {
  element person
  element system
  element component
}
model {
  person User
  person User2 {

  }
  user2 = person
  user3 = person 'Person3'
  component system {
    component subsystem {
    }
    backend = component {
      api = component 'API'
    }
  }
}
`
