export const valid_05_StrictElementRef = `
specification {
  element component
}
model {
  component system {
    component sub1 {
      component sub2
    }
  }
  extend system {
  }
  extend system.sub1 {
  }
  extend system.sub1.sub2 {
  }
}
`
export const invalid_05_StrictElementRefScope = `
specification {
  element component
}
model {
  component system {
    component sub1 {
      component sub2
    }
  }
  extend sub1 {
  }
}
`

export const invalid_05_StrictElementChildRefScope = `
specification {
  element component
}
model {
  component system {
    component sub1 {
      component sub2
    }
  }
  extend system.sub2 {
  }
}
`
