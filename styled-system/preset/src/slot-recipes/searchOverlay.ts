import { defineSlotRecipe } from '@pandacss/dev'

const treeNodeFocus = '.mantine-Tree-node:focus > .mantine-Tree-label &'

const focused = {
  outline: 'none',
  background: 'likec4.accent.8',
  borderColor: 'likec4.accent.9',
} as const

/**
 * Look of the search overlay of the diagram: translucent fullscreen dialog,
 * soft field, accent-highlighted result buttons.
 * Mirrors the styles in `packages/diagram/src/search`, so other screens (e.g. workspace search) look the same.
 */
export const searchOverlay = defineSlotRecipe({
  className: 'likec4-search-overlay',
  jsx: ['SearchOverlay', /^Search(Overlay|Panel)/],
  description: 'LikeC4 Search overlay',
  slots: [
    'dialog',
    'body',
    'header',
    'field',
    'tags',
    'columns',
    'column',
    'columnTitle',
    'list',
    'groupHead',
    'button',
    'buttonIcon',
    'buttonTitle',
    'buttonDescription',
    'buttonMeta',
    'badge',
    'hint',
    'footer',
  ],
  base: {
    dialog: {
      // Overlay animates --_opacity/--_blur only with the default motion preset, so fixed values here
      backgroundColor: '[rgb(34 34 34 / 95%)]',
      _light: {
        backgroundColor: '[rgb(250 250 250 / 95%)]',
      },
      backdropFilter: 'auto',
      backdropBlur: '[10px]',
    },
    body: {
      width: '100%',
      height: '100%',
      maxHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'stretch',
      gap: 'sm',
      paddingTop: '[20px]',
      paddingLeft: 'md',
      paddingRight: 'md',
      paddingBottom: 'sm',
      background: 'transparent',
    },
    header: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'sm',
      paddingX: 'sm',
    },
    field: {
      display: 'flex',
      alignItems: 'center',
      gap: 'sm',
      height: '[54px]',
      paddingLeft: 'sm',
      paddingRight: 'xs',
      borderRadius: 'md',
      border: '[1px solid transparent]',
      background: {
        base: 'transparent',
        _focusWithin: {
          base: 'mantine.gray[4]/55',
          _dark: 'mantine.dark[5]/55',
        },
        _groupHover: {
          base: 'mantine.gray[3]/35',
          _dark: 'mantine.dark[5]/35',
        },
      },
      '& > svg': {
        flexShrink: '0',
        color: 'text.dimmed',
      },
      '& input': {
        flex: '1',
        minWidth: '0',
        height: '100%',
        border: 'none',
        background: 'transparent',
        color: 'text.bright',
        fontFamily: 'body',
        fontSize: 'lg',
        outline: 'none',
        _placeholder: {
          color: 'text.dimmed',
        },
      },
    },
    tags: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '1.5',
      paddingLeft: '[48px]',
      minHeight: '[28px]',
    },
    columns: {
      flex: '1',
      minHeight: '0',
      display: 'grid',
      gridTemplateColumns: {
        base: '1fr',
        md: '1fr 1fr',
      },
      gap: 'md',
    },
    column: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '0',
    },
    columnTitle: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'xs',
      paddingX: 'md',
      paddingBottom: '1.5',
      fontSize: 'xs',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '[0.04em]',
      color: 'text.dimmed',
      cursor: 'default',
    },
    list: {
      flex: '1',
      minHeight: '0',
      overflowY: 'auto',
      paddingX: 'md',
      paddingBottom: 'md',
    },
    groupHead: {
      minWidth: '0',
      display: 'flex',
      alignItems: 'center',
      gap: 'xs',
      paddingY: '1.5',
      fontSize: 'xs',
      fontWeight: 'semibold',
      color: 'text.dimmed',
      cursor: 'default',
      backgroundColor: '[rgb(34 34 34 / 95%)]',
      _light: {
        backgroundColor: '[rgb(250 250 250 / 95%)]',
      },
    },
    button: {
      display: 'flex',
      width: '100%',
      gap: '2',
      minHeight: '[60px]',
      padding: '[12px 8px 12px 14px]',
      rounded: 'sm',
      border: 'default',
      background: 'surface.default',
      color: 'inherit',
      fontFamily: 'body',
      textAlign: 'left',
      cursor: 'pointer',
      _hover: {
        ...focused,
        borderColor: 'likec4.accent.9',
        background: 'likec4.accent.8/60',
      },
      _focus: focused,
      [treeNodeFocus]: focused,
      _dark: {
        borderColor: 'transparent',
        background: 'mantine.dark[6]/80',
      },
      _light: {
        background: 'white/80',
        _hover: {
          borderColor: 'likec4.accent.6',
          backgroundColor: 'likec4.accent.5',
        },
      },
    },
    buttonIcon: {
      flex: '[0 0 24px]',
      boxSize: '[24px]',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
      '--ti-size': '24px',
      color: {
        base: 'text.dimmed',
        _groupHover: 'likec4.accent.0',
        _groupFocus: 'likec4.accent.0',
      },
      '& svg, & img': {
        width: '100%',
        height: 'auto',
        maxHeight: '100%',
        pointerEvents: 'none',
      },
      '& img': {
        objectFit: 'contain',
      },
      '&.likec4-shape-icon svg': {
        strokeWidth: '[1.5]',
      },
      [treeNodeFocus]: {
        color: 'likec4.accent.0',
      },
    },
    buttonTitle: {
      fontSize: 'lg',
      fontWeight: 'medium',
      lineHeight: 'snug',
      minWidth: '0',
      color: {
        base: 'mantine.dark[1]',
        _light: 'mantine.gray[7]',
        _groupHover: {
          base: 'likec4.accent.1',
          _light: 'white',
        },
        _groupFocus: {
          base: 'likec4.accent.1',
          _light: 'white',
        },
      },
      [treeNodeFocus]: {
        color: {
          base: 'likec4.accent.1',
          _light: 'white',
        },
      },
      ':where([data-disabled]) &': {
        opacity: '[0.4]',
      },
    },
    buttonDescription: {
      marginTop: '1',
      fontSize: 'sm',
      lineHeight: 'sm',
      ':where([data-disabled]) &': {
        opacity: '[0.85]',
      },
      [treeNodeFocus]: {
        color: 'likec4.accent.0',
      },
      color: {
        base: 'text.dimmed',
        _groupHover: {
          base: 'likec4.accent.1',
          _light: 'likec4.accent.0',
        },
        _groupFocus: 'likec4.accent.0',
      },
    },
    buttonMeta: {
      flexShrink: '0',
      fontSize: 'xxs',
      fontWeight: 'medium',
      whiteSpace: 'nowrap',
      lineHeight: '[1.1]',
      color: {
        base: 'text.dimmed',
        _groupHover: {
          base: 'likec4.accent.1',
          _light: 'likec4.accent.0',
        },
        _groupFocus: 'likec4.accent.0',
      },
      [treeNodeFocus]: {
        color: 'likec4.accent.0',
      },
    },
    badge: {
      display: 'block',
      flexShrink: '0',
      fontSize: 'xxs',
      lineHeight: 'sm',
      fontWeight: 'medium',
      whiteSpace: 'nowrap',
      padding: '[1px 5px]',
      borderRadius: 'sm',
      background: 'mantine.dark[9]/30',
      _light: {
        background: 'mantine.gray[3]/20',
      },
    },
    hint: {
      paddingX: 'md',
      paddingY: 'lg',
      fontSize: 'sm',
      color: 'text.dimmed',
      cursor: 'default',
    },
    footer: {
      flexShrink: '0',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 'md',
      minHeight: '[40px]',
      paddingX: 'sm',
      fontSize: 'xs',
      color: 'text.dimmed',
      cursor: 'default',
    },
  },
  variants: {
    size: {
      md: {},
      // for popovers and hover cards
      sm: {
        button: {
          minHeight: '[40px]',
          padding: '[7px 8px 7px 10px]',
          gap: '1.5',
        },
        buttonIcon: {
          flex: '[0 0 16px]',
          boxSize: '[16px]',
          '--ti-size': '16px',
        },
        buttonTitle: {
          fontSize: 'sm',
        },
        buttonDescription: {
          marginTop: '0',
          fontSize: 'xs',
        },
        buttonMeta: {
          fontSize: 'xxs',
        },
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
  staticCss: ['*'],
})
