import { themeToVars } from '@mantine/vanilla-extract'

export const whereLight = ':where([data-mantine-color-scheme="light"])'
export const whereDark = ':where([data-mantine-color-scheme="dark"])'

// we need only variables names
export const mantine = themeToVars({})
