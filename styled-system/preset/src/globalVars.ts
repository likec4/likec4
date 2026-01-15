import type { Config } from '@pandacss/dev'
import { __v, vars } from './const.ts'
import { defaultTheme } from './defaults/index.ts'
import { rem } from './helpers.ts'

type ExtendableGlobalVars = NonNullable<Config['globalVars']>

export const globalVars: ExtendableGlobalVars = {
  extend: {
    [vars.textsize]: rem(defaultTheme.textSizes.md),
    // Use the primary color as the default palette
    [vars.palette.fill]: defaultTheme.colors.primary.elements.fill,
    [vars.palette.stroke]: defaultTheme.colors.primary.elements.stroke,
    [vars.palette.hiContrast]: defaultTheme.colors.primary.elements.hiContrast,
    [vars.palette.loContrast]: defaultTheme.colors.primary.elements.loContrast,
    [vars.palette.relationStroke]: defaultTheme.colors.gray.relationships.line,
    [vars.palette.relationLabel]: defaultTheme.colors.gray.relationships.label,
    [vars.palette.relationLabelBg]: defaultTheme.colors.gray.relationships.labelBg,
    [vars.palette.relationStrokeSelected]: __v('palette.relationStroke'),
    '--mantine-scale': '1',
    [vars.palette.outline]: __v('palette.loContrast'),
    [vars.spacing]: '/*-*/ /*-*/',
    '--text-fz': '/*-*/ /*-*/',
    [vars.icon.color]: '/*-*/ /*-*/',
    [vars.icon.size]: '/*-*/ /*-*/',
    [vars.font]: '/*-*/ /*-*/',
  },
}
