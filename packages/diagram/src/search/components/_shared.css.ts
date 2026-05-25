import { css, sva } from '@likec4/styles/css'

// export const titleColor = '--title-color'
// export const descriptionColor = '---description-color'
// export const iconColor = '--icon-color'

const buttonFocused = css.raw({
  outline: 'none',
  background: 'mantine.primary[8]',
  borderColor: 'mantine.primary[9]',
})

const _treenodefocus = '.mantine-Tree-node:focus > .mantine-Tree-label &'

const button = css.raw({
  display: 'flex',
  width: '100%',
  background: 'likec4.background',
  rounded: 'sm',
  padding: `[12px 8px 12px 14px]`,
  minHeight: '[60px]',
  gap: '2',
  // alignItems: 'flex-start',
  // transition: `all 50ms ${easings.inOut}`,
  border: 'default',
  // [titleColor]: '{colors.mantine.dark[1]}',
  // [iconColor]: '{colors.text.dimmed}',
  // [descriptionColor]: '{colors.text.dimmed}',
  _hover: {
    ...buttonFocused,
    borderColor: 'mantine.primary[9]',
    background: `mantine.primary[8]/60`,
  },
  _focus: buttonFocused,
  [_treenodefocus]: buttonFocused,
  _dark: {
    borderColor: 'transparent',
    background: `mantine.dark[6]/80`,
    // background: 'mantine.dark[6]',
  },
  _light: {
    background: `mantine.white/80`,
    // [iconColor]: '{colors.mantine.gray[6]}',
    // [titleColor]: '{colors.mantine.gray[7]}',
    _hover: {
      borderColor: 'mantine.primary[6]',
      backgroundColor: 'mantine.primary[5]',
      // [iconColor]: '{colors.mantine.primary[3])',
      // [titleColor]: '{colors.mantine.primary[0])',
      // [descriptionColor]: '{colors.mantine.primary[1]}',
    },
  },
})

export const focusable = 'likec4-focusable'

const iconSize = {
  ref: 'var(--likec4-icon-size, 24px)',
}

const icon = css.raw({
  color: {
    base: 'text.dimmed',
    _light: 'mantine.gray[5]',
    _groupHover: 'mantine.primary[0]',
    _groupFocus: 'mantine.primary[0]',
  },
  [_treenodefocus]: {
    color: 'mantine.primary[0]',
  },
  flex: `[0 0 ${iconSize.ref}]`,
  height: `[${iconSize.ref}]`,
  width: `[${iconSize.ref}]`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-start',

  ['--ti-size']: iconSize.ref,
  [`& svg, & img`]: {
    width: '100%',
    height: 'auto',
    maxHeight: '100%',
    pointerEvents: 'none',
  },
  [`& img`]: {
    objectFit: 'contain',
  },
  '&.likec4-shape-icon svg': {
    // color: `[var(${iconColor})]`,
    strokeWidth: '[1.5]',
  },
  // [iconSize]: '24px',
  // [whenContainerIsNarrow]: {
  //   [iconSize]: '18px',
  // },
})

const title = css.raw({
  fontSize: 'md',
  fontWeight: 'medium',
  lineHeight: 'xxs',
  [`:where([data-disabled]) &`]: {
    opacity: 0.4,
  },

  color: {
    base: 'mantine.dark[1]',
    _light: 'mantine.gray[7]',
    _groupHover: {
      base: 'mantine.primary[1]',
      _light: 'white',
    },
    _groupFocus: {
      base: 'mantine.primary[1]',
      _light: 'white',
    },
  },
  [_treenodefocus]: {
    color: {
      base: 'mantine.primary[1]',
      _light: 'white',
    },
  },
})
const descriptionColor = css.raw({
  color: {
    base: 'text.dimmed',
    _groupHover: {
      base: 'mantine.primary[1]',
      _light: 'mantine.primary[0]',
    },
    _groupFocus: 'mantine.primary[0]',
  },
  [_treenodefocus]: {
    color: 'mantine.primary[0]',
  },
})

const description = css.raw(descriptionColor, {
  marginTop: '1',
  fontSize: 'xs',
  lineHeight: 'sm',

  [`:where([data-disabled]) &`]: {
    opacity: 0.85,
  },
})

export const emptyBoX = css({
  width: '100%',
  height: '100%',
  borderStyle: 'dashed',
  borderWidth: '2',
  borderColor: 'default.border',
  rounded: 'md',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: 'md',
  color: 'text.dimmed',
  padding: 'md',
  paddingBlock: 'xl',
})

export const buttonsva = sva({
  slots: ['root', 'icon', 'title', 'description', 'descriptionColor'],
  className: 'search-button',
  base: {
    root: button,
    icon,
    title,
    description,
    descriptionColor,
  },
})
