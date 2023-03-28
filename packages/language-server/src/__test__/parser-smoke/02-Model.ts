export const valid_02_Model_Element = `
specification {
  element person
}
model {
  person user1
  person user2
}
`
export const valid_02_Model_Element_2 = `
specification {
  element person
}
model {
  user1 = person
  user2 = person
}
`
export const valid_02_Model_ElementWithTitle = `
specification {
  element person
}
model {
  person user1
  user2 = person 'Person2'
  user3 = person
}
`
export const valid_02_Model_Element_Style = `
specification {
  element person
}
model {
  user1 = person {
    style {
      shape person
      color secondary
    }
  }
  user2 = person
}
`
export const invalid_02_Model = `
specification {
  element person
}
model {
  user = person
  person 'Person2'
}
`
export const valid_02_Model_NestedElemenets = `
specification {
  element person
  element system
  element component
}
model {
  person user1
  user2 = person {
  }
  user3 = person 'Person3'
  component system {
    subsystem = component
    backend = component {
      api = component 'API'
    }
  }
}
`
export const invalid_02_Model_NestedElemenets = `
specification {
  element person
  element component
}
model {
  person user1
  component system {
    component 'Subsystem'
    component backend
  }
}
`

export const valid_02_ModelElementProps = `
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
