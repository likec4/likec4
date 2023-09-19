import { defaultTheme } from '@likec4/core/dist/colors.js'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const colors = Object.keys(defaultTheme.colors)

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
      style {
        color ${key}
      }

      cylinder = cylinder {
        title: 'Cylinder'
        description: 'Example of Cylinder Shape'
        style {
          color ${key}
        }
      }
      queue = queue {
        title: 'Queue'
        description: 'Example of Queue Shape'
        style {
          color ${key}
        }
      }
      mobile = mobile {
        title: 'Mobile'
        description: 'Example of Mobile Shape'
        style {
          color ${key}
        }
      }
      browser = browser {
        title: 'Browser'
        description: 'Example of Browser Shape'
        style {
          color ${key}
        }
      }
      person = person {
        title: 'Person'
        description: 'Example of Person Shape'
        style {
          color ${key}
        }
      }
      rect = rect {
        title: 'Rectangle'
        description: 'Example of Rectangle Shape'
        style {
          color ${key}
        }
      }
      person -> rect
      browser -> mobile
      cylinder -> queue
    }`
  )
  .join('')}
  }

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
  }

${colors
  .map(
    key => `
  view themecolor_${key} of ${key} {
    title "Theme Color: ${key}"
    include colors, ${key}, ${key}.*
  }
`
  )
  .join('')}

}
`

const __filename = new URL(import.meta.url).pathname
const __dirname = dirname(__filename)

const out = resolve(__dirname, '../src/stories/likec4/theme.c4')

writeFileSync(out, likec4)

console.log(`Generated ${out}`)
