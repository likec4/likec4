export const valid_04_Scope = `
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
}
`
export const invalid_04_DuplicateNameInScope = `
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
}
`
