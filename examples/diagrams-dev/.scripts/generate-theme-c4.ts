/**
 * This script generates theme.c4:
 * - model with all theme colors and shapes
 * - views for each theme color
 * - nested shapes (6 levels)
 */
import { defaultTheme } from '@likec4/core'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

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
${colors
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

      this -> compound1
    }`
  )
  .join('')}
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
  colors -> compound1

  // Col1
  primary -> secondary
  secondary -> muted

  // Col2
  blue -> sky
  sky -> indigo

  // Col3
  gray -> slate

  // Col4
  red -> amber
  amber -> green

}

views {

  view themecolors of colors {
    title "Theme Colors"
    include *
    exclude compoundtest
  }

${colors
  .map(
    key => `
  view themecolor_${key} of ${key} {
    title "Theme Color: ${key}"
    include colors, ${key}, ${key}.*

    include element.kind = compound
    style element.kind = compound {
      color ${key}
    }
  }
`
  )
  .join('')}

}
`

const __filename = new URL(import.meta.url).pathname
const __dirname = dirname(__filename)

let out = resolve(__dirname, '../likec4/theme.c4')

writeFileSync(out, likec4)

console.log(`Generated ${out}`)

const relationships = `// DO NOT EDIT MANUALLY
specification {

  element themerelationships

  relationship solid {
    line dotted
    head none
  }

${colors
  .map(
    key => `
  relationship ${key} {
    color ${key}
    tail vee
    head vee
  }
`
  )
  .join('')}

}

model {

  themerelationships relationship_colors {
    title 'Relationships Colors'
    style {
      color muted
    }

${colors
  .map(
    key => `
    ${key}_source = rect '${key.toUpperCase()} Source' {
      style { color ${key} }
    }
    ${key}_target = rect '${key.toUpperCase()} Target' {
      style { color ${key} }
    }
    ${key}_source -[${key}]-> ${key}_target 'relation with ${key} color'
`
  )
  .join('')}
  }

  // Col1
  primary_target -[solid]-> secondary_source
  secondary_target -[solid]-> muted_source

  // Col2
  blue_target -[solid]-> sky_source
  sky_target -[solid]-> indigo_source

  // Col3
  gray_target -[solid]-> slate_source

  // Col4
  red_target -[solid]-> amber_source
  amber_target -[solid]-> green_source
}

views {

  view relationshipcolors of relationship_colors {
    include *
  }

  ${colors
    .map(
      key => `
  view relationship_${key} of ${key}_source {
    include *, relationship_colors
    exclude -> ${key}_source
  }
  view relationship_${key}_target of ${key}_target {
    include *, relationship_colors
    exclude ${key}_target ->
    style relationship_colors {
      color ${key}
    }
  }
  `
    )
    .join('')}

}
`

out = resolve(__dirname, '../likec4/relationships.c4')

writeFileSync(out, relationships)

console.log(`Generated ${out}`)
