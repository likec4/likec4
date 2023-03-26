export const fixture_06_ElementRef = `
specification {
  element component
}
model {
  component user
  component system {
    component sub1 {
      component sub2
    }
  }
  user -> sub1.sub2
  component system2 {
    it -> system.sub2
  }
}
`

export const failing_fixture_06_ElementRef = `
specification {
  element component
}
model {
  component user
  component system {
    component sub1 {
      component sub2
    }
  }
  user -> sub2.sub1
}
`
// export const failing_fixture_06_ElementRefScope = `
// specification {
//   element component
// }
// model {
//   component system {
//     component sub1 {
//       component sub2
//     }
//   }
//   extends sub1 {
//   }
// }
// `

// export const failing_fixture_06_ElementChildRefScope = `
// specification {
//   element component
// }
// model {
//   component system {
//     component sub1 {
//       component sub2
//     }
//   }
//   extends system.sub2 {
//   }
// }
// `
