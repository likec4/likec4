import { themeToVars } from '@mantine/vanilla-extract'
import { theme } from './theme'

export const whereLight = ':where([data-mantine-color-scheme="light"])'

export const mantine = themeToVars(theme)
