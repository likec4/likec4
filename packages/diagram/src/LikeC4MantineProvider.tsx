import { css } from '@likec4/styles/css'
import type { Token, TokenCategory, Tokens } from '@likec4/styles/tokens'
import { token } from '@likec4/styles/tokens'
import {
  type CSSVariablesResolver,
  type MantineColorsTuple,
  type MantineProviderProps,
  Card,
  Code,
  createTheme,
  MantineProvider,
  Menu,
  mergeThemeOverrides,
  Paper,
  Popover,
  SegmentedControl,
  Table,
  Title,
  Tooltip,
} from '@mantine/core'

import { type JSX, useMemo } from 'react'
import { map } from 'remeda'

function t(name: Token) {
  return token.var(name)
}

const tshirts = ['xs', 'sm', 'md', 'lg', 'xl'] as const
type TShirtSize = (typeof tshirts)[number]
type WithTShirtSize = {
  [K in keyof Tokens]: TShirtSize extends Tokens[K] ? K : never
}[TokenCategory]

const sizes = (tokenCategory: WithTShirtSize) => {
  return Object.fromEntries(tshirts.map((size) => [
    size,
    t(`${tokenCategory}.${size}`),
  ]))
}

const shades = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
type ColorsWithShades = 'likec4.accent'

const mapColor = (color: ColorsWithShades): MantineColorsTuple => {
  return map(shades, shade => t(`colors.${color}.${shade}`))
}

const titles = [
  css({ textStyle: 'h1' }),
  css({ textStyle: 'h2' }),
  css({ textStyle: 'h3' }),
  css({ textStyle: 'h4' }),
  css({ textStyle: 'h5' }),
  css({ textStyle: 'h6' }),
] as const

const likec4Theme = createTheme({
  primaryColor: 'likec4',
  cursorType: 'pointer',
  autoContrast: true,
  colors: {
    likec4: mapColor('likec4.accent'),
  },
  fontFamily: t('fonts.body'),
  fontFamilyMonospace: t('fonts.mono'),
  headings: {
    fontFamily: t('fonts.display'),
    fontWeight: t('fontWeights.bold'),
  },
  defaultRadius: 'sm',
  fontWeights: {
    regular: t('fontWeights.normal'),
    medium: t('fontWeights.medium'),
    semibold: t('fontWeights.semibold'),
    bold: t('fontWeights.bold'),
  },
  fontSizes: {
    ...sizes('fontSizes'),
    xxs: t('fontSizes.xxs'),
  },
  spacing: {
    ...sizes('spacing'),
    xxs: t('spacing.xxs'),
  },
  radius: sizes('radii'),
  shadows: sizes('shadows'),
  lineHeights: sizes('lineHeights'),
  components: {
    Card: Card.extend({
      defaultProps: {
        radius: 'md',
      },
      classNames: {
        root: css({
          bg: 'surface.default',
        }),
      },
    }),
    Paper: Paper.extend({
      defaultProps: {
        radius: 'md',
      },
      classNames: {
        root: css({
          bg: 'surface.default',
        }),
      },
    }),
    Title: Title.extend({
      classNames: (_theme, props) => ({
        root: titles[(props.order ?? 1) - 1],
      }),
    }),
    // Modal: Modal.extend({
    //   classNames: {
    //     body: css({
    //       layerStyle: 'likec4',
    //     }),
    //   },
    // }),
    Code: Code.extend({
      classNames: {
        root: css({
          bg: 'surface.code',
        }),
      },
    }),
    /* table column headers: all-caps eyebrow treatment (11px, letter-spaced) */
    Table: Table.extend({
      classNames: {
        th: css({
          fontSize: 'xxs',
          fontWeight: 'bold',
          color: 'text.dimmed',
          textTransform: 'uppercase',
          letterSpacing: 'caps.sm',
        }),
      },
    }),
    Tooltip: Tooltip.extend({
      defaultProps: {
        color: 'dark',
        fz: 'xs',
      },
      // classNames: {
      //   tooltip: css({
      //     // layerStyle: 'tooltip',
      //     fontSize: 'xs',
      //   }),
      // },
    }),
    SegmentedControl: SegmentedControl.extend({
      vars: (theme, props) => ({
        root: {
          // @ts-expect-error
          '--sc-font-size': theme.fontSizes[props.fz ?? props.size],
        },
      }),
    }),
    Popover: Popover.extend({
      defaultProps: {
        withArrow: false,
        radius: 'sm',
        shadow: 'lg',
      },
    }),
    Menu: Menu.extend({
      defaultProps: {
        radius: 'sm',
        shadow: 'md',
      },
    }),
    // Select: Select.extend({
    //   classNames: select(),
    //   defaultProps: {
    //     checkIconPosition: 'right',
    //   },
    // }),
  },
})

// Our tokens are already semantic, so we just use
// on both themes
const semantic = (variables: Record<string, string>) => ({
  dark: variables,
  light: variables,
})

const resolver: CSSVariablesResolver = (_) => ({
  variables: {
    '--mantine-radius-default': t('radii.sm'),
  },
  ...semantic({
    '--mantine-color-text': t('colors.text'),
    '--mantine-color-body': t('colors.surface.default'),
    // '--mantine-color-error': t('colors.danger'),
    '--mantine-color-placeholder': t('colors.text.non-essential'),
    '--mantine-color-anchor': t('colors.text.link'),
    '--mantine-color-disabled': t('colors.disabled.body'),
    '--mantine-color-disabled-color': t('colors.disabled.text'),
    '--mantine-color-disabled-hover': t('colors.disabled.body'),
    '--mantine-color-disabled-border': t('colors.disabled.border'),

    '--mantine-color-default': t('colors.surface.default'),
    '--mantine-color-default-color': t('colors.text'),
    '--mantine-color-default-border': t('colors.border.default'),
    '--mantine-color-default-hover': t('colors.surface.hover'),
  }),
})

type LikeC4MantineProviderProps = MantineProviderProps

/**
 * LikeC4 Mantine provider with custom theme and CSS variables resolver
 */
export function LikeC4MantineProvider({
  children,
  defaultColorScheme = 'auto',
  theme,
  ...props
}: LikeC4MantineProviderProps): JSX.Element {
  const mergedTheme = useMemo(
    () => theme ? mergeThemeOverrides(likec4Theme, theme) : likec4Theme,
    [theme],
  )
  return (
    <MantineProvider
      defaultColorScheme={defaultColorScheme}
      theme={mergedTheme}
      cssVariablesResolver={resolver}
      {...props}
    >
      {children}
    </MantineProvider>
  )
}

/**
 * This is a deprecated alias for LikeC4MantineProvider.
 * @deprecated Use LikeC4MantineProvider instead
 */
export const DefaultMantineProvider = LikeC4MantineProvider
