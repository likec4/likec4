/**
 * This script generates theme.c4:
 * - model with all theme colors and shapes
 * - views for each theme color
 * - nested shapes (6 levels)
 */
import { defaultTheme } from '@likec4/core'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const colors = Object.keys(defaultTheme.elements)

const likec4 = `// DO NOT EDIT MANUALLY

specification {

  element themecolor
  element cylinder {
    style {
      shape cylinder
    }
  }
  element queue {
    style {
      shape queue
    }
  }
  element rect {
    style {
      shape rectangle
    }
  }
  element person {
    style {
      shape person
    }
  }
  element mobile {
    style {
      shape mobile
    }
  }
  element browser {
    style {
      shape browser
    }
  }
  element compound
}
model {

  themecolor colors {
    title: 'Theme Colors'
    style {
      color gray
    }
${
  colors
    .map(
      key => `
    themecolor ${key} {
      title "${key.toUpperCase()}"
      description '
        Example of ${key} Theme Color
        with multiline description
        and more text
      '
      style {
        color ${key}
      }

      cylinder = cylinder {
        title: 'Cylinder'
        technology: 'cylinder'
        description: '
          Example of Cylinder Shape
          with multiline description
        '
        style {
          color ${key}
        }
      }
      queue = queue {
        title: 'Queue'
        technology: 'queue shape'
        description: '
          Example of Queue Shape
          with multiline description
        '
        style {
          color ${key}
        }
      }
      mobile = mobile {
        title: 'Mobile'
        technology: 'mobile shape'
        description: '
          Example of Mobile Shape
          with multiline description
        '
        style {
          color ${key}
        }
      }
      browser = browser {
        title: 'Browser'
        technology: 'browser shape'
        description: '
          Example of Browser Shape
          with multiline description
        '
        style {
          color ${key}
        }
      }
      person = person {
        title: 'Person'
        technology: 'person shape'
        description: '
          Example of Person Shape
          with multiline description
        '
        style {
          color ${key}
        }
      }
      rect = rect {
        title: 'Rectangle'
        technology: 'rect shape'
        description: '
          Example of Rectangle Shape
          with multiline description
        '
        style {
          color ${key}
        }
      }
      person -> rect
      browser -> mobile
      cylinder -> queue
    }`
    )
    .join('')
}
  }

  themecolor compoundtest {
    compound1 = compound 'Level 1' {
      compound2 = compound 'Level 2' {
        compound3 = compound 'Level 3' {
          compound4 = compound 'Level 4' {
            compound5 = compound 'Level 5' {
              compound6 = compound 'Level 6'
            }
          }
        }
      }
    }
  }

}

views {

  view themecolors of colors {
    title "Theme Colors"
    include *
    exclude compoundtest
  }

${
  colors
    .map(
      key => `
  view themecolor_${key} of ${key} {
    title "Theme Color: ${key}"
    include *, colors

    include element.kind = compound
    style element.kind = compound {
      color ${key}
    }
  }
`
    )
    .join('')
}

}
`

const __filename = new URL(import.meta.url).pathname
const __dirname = dirname(__filename)

let out = resolve(__dirname, '../likec4/theme/colors.c4')

writeFileSync(out, likec4)

console.log(`Generated ${out}`)

const relationships = `// DO NOT EDIT MANUALLY
specification {

  element themerelationships
  tag source

  relationship solid {
    line solid
  }

${
  colors
    .map(
      key => `
  relationship ${key} {
    color ${key}
  }
  relationship back_${key} {
    color ${key}
    head none
    tail onormal
  }
`
    )
    .join('')
}

}

model {

  themerelationships relationship_colors {
    title 'Relationships Colors'
    style {
      color muted
    }

${
  colors
    .map(
      key => `
    ${key}_source = rect '${key.toUpperCase()}' {
      #source
      style { color ${key} }
    }
    ${key}_target = rect '${key.toUpperCase()}' {
      style { color ${key} }
    }
    ${key}_source -[${key}]-> ${key}_target 'relation with ${key} color'
    ${key}_target -[back_${key}]-> ${key}_source 'back relation with ${key} color'
`
    )
    .join('')
}
  }
}

views {

  view relationshipcolors of relationship_colors {
    include relationship_colors
    include element.tag == #source
  }

  ${
  colors
    .map(
      key => `
  view relationship_${key} of ${key}_source {
    include relationship_colors,
      ${key}_source with {
        technology 'source'
        description: '
          Example of ${key} relationship color
          above muted color'
      },
      ${key}_target with {
        technology 'target'
        description: '
          Example of ${key} relationship color
          above ${key} color'
      }
  }
  view relationship_${key}_target of ${key}_target {
    include relationship_colors,
      ${key}_source with {
        technology 'source'
        description: '
          Example of ${key} relationship color
          above muted color'
      },
      ${key}_target with {
        technology 'target'
        description: '
          Example of ${key} relationship color
          above ${key} color'
      }
    style relationship_colors {
      color ${key}
    }
  }
  `
    )
    .join('')
}

}
`

out = resolve(__dirname, '../likec4/relationships/colors.c4')

writeFileSync(out, relationships)

console.log(`Generated ${out}`)
