import { hasAtLeast, isString, prop } from 'remeda'

export const vars = {
  font: '--likec4-app-font',
  spacing: '--likec4-spacing',
  textsize: '--likec4-text-size',
  palette: {
    fill: '--likec4-palette-fill',
    stroke: '--likec4-palette-stroke',
    hiContrast: '--likec4-palette-hiContrast',
    loContrast: '--likec4-palette-loContrast',
    relationStroke: '--likec4-palette-relation-stroke',
    relationStrokeSelected: '--likec4-palette-relation-stroke-selected',
    relationLabel: '--likec4-palette-relation-label',
    relationLabelBg: '--likec4-palette-relation-label-bg',
    outline: '--likec4-palette-outline',
  },
  icon: {
    size: '--likec4-icon-size',
    color: '--likec4-icon-color',
  },
} as const

type Vars =
  | Exclude<keyof typeof vars, 'palette' | 'icon'>
  | `palette.${keyof typeof vars.palette}`
  | `icon.${keyof typeof vars.icon}`

function readName(key: string): string | undefined {
  let path = (key.includes('.'))
    ? key.split('.')
    : [key]
  if (!hasAtLeast(path, 1)) {
    return undefined
  }
  let name = prop(
    vars,
    // @ts-expect-error
    ...path,
  )
  return isString(name) ? name : undefined
}

/**
 * Returns a CSS variable declaration string.
 *
 * If `defaultTo` is not provided, returns a string like `var(--likec4-palette-fill)`.
 * If `defaultTo` is a Vars or string, returns a string like `var(--likec4-palette-fill, var(--default-to))`.
 *
 * @param key - The name of the CSS variable to generate.
 * @param defaultTo - An optional string, Vars, or object to use as the default value.
 * @returns A CSS variable declaration string.
 */
export function __v(
  key: Vars,
  defaultTo?: Vars | `var(${string})` | `{${string}}` | (string & Record<never, unknown>),
): `var(${string})` {
  let name = readName(key)
  if (!name) {
    throw new Error(`Unknown var: ${key}`)
  }
  if (!defaultTo) {
    return `var(${name})`
  }
  const defaultValue = readName(defaultTo)
  if (defaultValue) {
    return `var(${name}, var(${defaultValue}))`
  }
  return `var(${name}, ${defaultTo})`
}
