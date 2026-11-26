import { styled } from '@likec4/styles/jsx'
import type { ComponentProps, CSSProperties } from 'react'

const MonogramBox = styled('span', {
  base: {
    flexShrink: '0',
    display: 'inline-grid',
    placeItems: 'center',
    // --mono is set from the `color` prop
    backgroundColor: '[var(--mono)]',
    color: 'white',
    fontFamily: 'body',
    fontWeight: 'semibold',
    letterSpacing: '[0.02em]',
    borderRadius: 'sm',
  },
  variants: {
    size: {
      lg: {
        width: '[36px]',
        height: '[36px]',
        fontSize: 'sm',
      },
      sm: {
        width: '[24px]',
        height: '[24px]',
        fontSize: 'xxs',
      },
      chip: {
        width: '[20px]',
        height: '[20px]',
        fontSize: 'micro',
      },
      mini: {
        width: '[22px]',
        height: '[22px]',
        fontSize: 'micro',
        // ring in the card surface, so overlapping monograms stay readable
        boxShadow: '[0 0 0 2px var(--colors-surface-default)]',
        cursor: '[help]',
      },
    },
  },
})

export type MonogramSize = 'lg' | 'sm' | 'chip' | 'mini'

export type MonogramProps = Omit<ComponentProps<typeof MonogramBox>, 'color' | 'size'> & {
  /**
   * Background color, any CSS color
   */
  color: string
  size: MonogramSize
}

/**
 * Colored square with initials
 */
export function Monogram({ color, size, style, ...props }: MonogramProps) {
  return <MonogramBox size={size} style={{ ...style, ['--mono' as string]: color } as CSSProperties} {...props} />
}

/**
 * Overlapping row of mini monograms
 */
export const MonogramStack = styled('span', {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    '& > *:not(:first-child)': {
      marginLeft: '[-4px]',
    },
  },
})

/**
 * "+N" at the end of a {@link MonogramStack}
 */
export const MonogramMore = styled('span', {
  base: {
    display: 'inline-grid',
    placeItems: 'center',
    width: '[22px]',
    height: '[22px]',
    borderRadius: 'sm',
    fontFamily: 'body',
    fontSize: 'micro',
    fontWeight: 'semibold',
    backgroundColor: 'surface.sunken',
    boxShadow: '[0 0 0 2px var(--colors-surface-default), inset 0 0 0 1px var(--colors-border-subtle)]',
    cursor: '[help]',
    color: 'text.dimmed',
  },
})
