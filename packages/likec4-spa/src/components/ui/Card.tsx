import { styled } from '@likec4/styles/jsx'
import { IconArrowUpRight, IconChevronDown } from '@tabler/icons-react'
import type { ComponentProps } from 'react'

/**
 * Responsive grid of cards
 */
export const CardGrid = styled('div', {
  base: {
    display: 'grid',
    gridTemplateColumns: { base: '1fr', sm: 'repeat(auto-fill, minmax(340px, 1fr))' },
    alignItems: 'start',
    gap: { base: '5', sm: '8' },
  },
  variants: {
    /**
     * Cards of a row get the same height, so their footers line up
     */
    equalHeight: {
      true: {
        alignItems: 'stretch',
        gap: { base: '5', sm: '6' },
      },
    },
  },
})

export const Card = styled('article', {
  base: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minWidth: '0',
    backgroundColor: 'surface.default',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'border.subtle',
    borderRadius: 'md',
    boxShadow: 'xs',
    transition: 'fast',
    transitionProperty: '[border-color, box-shadow]',
    _hover: {
      borderColor: 'border.strong',
      boxShadow: 'sm',
    },
  },
})

/**
 * Monogram, titles and the open indicator.
 * The link of the {@link CardTitle} covers the head, not the whole card,
 * so the rest of the card keeps its own hovers and buttons
 */
export const CardHead = styled('div', {
  base: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '3.5',
    paddingTop: '5',
    paddingX: '5',
    borderTopRadius: 'md',
    '& a::after': {
      borderRadius: '[inherit]',
    },
    '& [data-open-indicator]': {
      opacity: '0',
    },
    '&:is(:hover, :focus-within) [data-open-indicator]': {
      opacity: '1',
    },
  },
})

/**
 * Title and subtitle, one above the other
 */
export const CardTitles = styled('div', {
  base: {
    flex: '1',
    minWidth: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '1',
  },
})

/**
 * Card title. A link inside stretches over the nearest positioned parent (the head, or the whole card),
 * so that area is one click target
 */
export const CardTitle = styled('h3', {
  base: {
    margin: '0',
    lineHeight: '[1.35]',
    fontWeight: 'semibold',
    color: 'text.bright',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '& a': {
      color: 'inherit',
      textDecoration: 'none',
      outline: 'none',
      _after: {
        content: '""',
        position: 'absolute',
        inset: '0',
        borderRadius: 'md',
      },
      _focusVisible: {
        _after: {
          outline: '[2px solid var(--colors-primary-border)]',
          outlineOffset: '[2px]',
        },
      },
    },
  },
  variants: {
    size: {
      lg: {
        fontFamily: 'display',
        fontSize: 'xl',
      },
      md: {
        fontFamily: 'body',
        fontSize: 'md',
      },
    },
  },
  defaultVariants: {
    size: 'lg',
  },
})

export const CardSubtitle = styled('span', {
  base: {
    fontFamily: 'body',
    fontSize: 'xs',
    lineHeight: '[1.35]',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: 'text.dimmed',
  },
})

const OpenIndicator = styled(IconArrowUpRight, {
  base: {
    flexShrink: '0',
    transition: 'fast',
    color: 'text.dimmed',
  },
})

/**
 * Arrow in the head, shown while the head is hovered or focused
 */
export function CardOpenIndicator() {
  return <OpenIndicator size={18} aria-hidden data-open-indicator />
}

/**
 * Details under a {@link CardHead}.
 * Grows to fill the card, so footers line up across a row of equal-height cards
 */
export const CardBody = styled('div', {
  base: {
    // above the stretched link of the head
    position: 'relative',
    zIndex: '[1]',
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    paddingTop: '3',
    paddingRight: '5',
    paddingBottom: '[18px]',
    // details hang off the title's left edge: card padding (20) + monogram (36) + head gap (14)
    paddingLeft: '[70px]',
  },
})

/**
 * Sunken footer; the radius follows the card unless a {@link CardPanel} comes after it
 */
export const CardFoot = styled('div', {
  base: {
    // above the stretched link, so tooltips and buttons stay usable
    position: 'relative',
    zIndex: '[1]',
    display: 'flex',
    alignItems: 'center',
    gap: '5',
    minHeight: '[52px]',
    paddingY: '2',
    paddingLeft: '5',
    paddingRight: '3',
    backgroundColor: 'surface.sunken',
    borderTopWidth: '1',
    borderTopStyle: 'solid',
    borderColor: 'border.subtle',
    // inner radius of the card border
    borderBottomRadius: '[calc(var(--radii-md) - 1px)]',
    '&:not(:last-child)': {
      borderBottomRadius: '0',
    },
  },
})

/**
 * Expandable panel below the footer
 */
export const CardPanel = styled('div', {
  base: {
    position: 'relative',
    zIndex: '[1]',
    display: 'flex',
    flexDirection: 'column',
    gap: '3',
    paddingTop: '4',
    paddingX: '5',
    paddingBottom: '5',
    backgroundColor: 'surface.sunken',
    borderTopWidth: '1',
    borderTopStyle: 'solid',
    borderColor: 'border.subtle',
    borderBottomRadius: 'md',
  },
})

const ExpandButtonBox = styled('button', {
  base: {
    display: 'inline-grid',
    placeItems: 'center',
    width: '[28px]',
    height: '[28px]',
    marginLeft: 'auto',
    border: 'none',
    borderRadius: 'sm',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: 'text.dimmed',
    _hover: {
      backgroundColor: 'surface.hover',
      color: 'text',
    },
    '& svg': {
      transition: 'fast',
    },
    '&[aria-expanded="true"] svg': {
      transform: 'rotate(180deg)',
    },
  },
})

/**
 * Chevron button that toggles a {@link CardPanel}
 */
export function ExpandButton({ expanded, ...props }: Omit<ComponentProps<typeof ExpandButtonBox>, 'children'> & {
  expanded: boolean
}) {
  return (
    <ExpandButtonBox type="button" aria-expanded={expanded} {...props}>
      <IconChevronDown size={16} />
    </ExpandButtonBox>
  )
}
