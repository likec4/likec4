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
export const fixture_02_ModelElementProps = `
specification {
  element component
  tag one
}
model {
  component system {
    #one

    component subsystem {
      title: 'SubSystem'
    }
    component storage {
      title 'Storage'
      style {
        shape: storage
      }
    }
  }
}
`
