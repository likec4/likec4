import {
  type DefaultMantineColor,
  type MantineColorsTuple,
  type MantineThemeOverride,
  createTheme,
  DEFAULT_THEME,
  rem,
} from '@mantine/core'

export const theme = createTheme({
  autoContrast: true,
  cursorType: 'pointer',
  fontFamily: 'var(--likec4-app-font)',
  defaultRadius: 'sm',
  respectReducedMotion: true,
  primaryColor: 'main',
  colors: {
    main: DEFAULT_THEME.colors.indigo,
  },
  fontSizes: {
    ...DEFAULT_THEME.fontSizes,
    xxs: rem(10),
  },
  spacing: {
    ...DEFAULT_THEME.spacing,
    xxs: rem(8),
  },
  headings: {
    fontWeight: '500',
    sizes: {
      h1: {
        // fontSize: '2rem',
        fontWeight: '600',
      },
      h2: {
        // fontSize: '1.85rem',
      },
    },
  },
}) as MantineThemeOverride

type ExtendedCustomColors =
  | 'main'
  | DefaultMantineColor

declare module '@mantine/core' {
  export interface MantineThemeColorsOverride {
    colors: Record<ExtendedCustomColors, MantineColorsTuple>
  }
}
