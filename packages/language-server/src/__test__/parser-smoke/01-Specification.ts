export const valid_01_Specification = `
specification {
  element container
  element component {
    style {
      shape: rectangle
    }
  }
  element person {
    style {
      shape: person
    }
  }

  tag gray
  tag lightgray
}
`
export const valid_01_Specification_ElementKindStyle = `
specification {
  element frontend {
    style {
      shape browser
      color secondary
    }
  }
  element person {
    style {
      shape: person
    }
  }
}
`
// export const invalid_01_Specification_BuiltinElementKind = `
// specification {
//   element element {
//     style {
//       shape browser
//     }
//   }
// }
// `
