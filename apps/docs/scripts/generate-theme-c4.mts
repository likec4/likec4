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

const shapes = [
  'rectangle',
  'storage',
  'queue',
  'person',
  'mobile',
  'browser',
] as const

const likec4 = `// DO NOT EDIT MANUALLY

specification {

  element themecolor {
    style {
      opacity 20%
    }
  }
${shapes.map(shape => `
  element ${shape} {
    style {
      shape ${shape}
    }
  }
`).join('')}
}
model {

  themecolor colors {
    title: 'Theme Colors'
    style {
      color muted
    }
${
  colors
    .map(
      key => `
    themecolor ${key} {
      title "${key.charAt(0).toUpperCase() + key.slice(1)}"
      description '
        Example of ${key} Theme Color
        with multiline description
        and more text
      '
      style {
        color ${key}
      }
${shapes.map(shape => `
      ${shape} = ${shape} {
        title: '${shape.charAt(0).toUpperCase() + shape.slice(1)}'
        technology: '[${key}]'
        description: '
          Example of ${shape.charAt(0).toUpperCase() + shape.slice(1)} shape
          with multiline description
          and ${key} color
        '
        style {
          color ${key}
        }
      }
`).join('')}
    }`).join('')}
  }
}

views {

  view index of colors {
    title "Theme Colors"
    include *
  }

${shapes.map(shape => `
  view ${shape} {
    title "Shape: ${shape.charAt(0).toUpperCase() + shape.slice(1)}"
    include
      colors with {
        title "Shape: ${shape.charAt(0).toUpperCase() + shape.slice(1)}"
      },
${colors.map(key => `
      ${key}.${shape} with {
        title '${key.charAt(0).toUpperCase() + key.slice(1)}'
        technology '[${shape}]'
        navigateTo themecolor_${key}
      },
`).join('')}
  }
`).join('')}

${
  colors
    .map(
      key => `
  view themecolor_${key} of ${key} {
    title "Theme Color: ${key}"
    include
      ${key} with {
        title "Theme Color: ${key}"
        navigateTo index
      },
${shapes.map(shape => `
      ${shape} with {
        navigateTo ${shape}
      },
`).join('')}
  }
`).join('')}
}
`

const __filename = new URL(import.meta.url).pathname
const __dirname = dirname(__filename)

let out = resolve(__dirname, '../likec4/theme/colors.c4')

writeFileSync(out, likec4)

console.log(`Generated ${out}`)
