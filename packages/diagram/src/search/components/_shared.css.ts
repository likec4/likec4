import { css, sva } from '@likec4/styles/css'

// export const titleColor = '--title-color'
// export const descriptionColor = '---description-color'
// export const iconColor = '--icon-color'

const buttonFocused = css.raw({
  outline: 'none',
  background: 'mantine.colors.primary[8]',
  borderColor: 'mantine.colors.primary[9]',
})

const _treenodefocus = '.mantine-Tree-node:focus > .mantine-Tree-label &'

const button = css.raw({
  display: 'flex',
  width: '100%',
  background: 'mantine.colors.body',
  rounded: 'sm',
  padding: `[12px 8px 12px 14px]`,
  minHeight: '60px',
  gap: '[8px]',
  // alignItems: 'flex-start',
  // transition: `all 50ms ${easings.inOut}`,
  border: `1px solid`,
  borderColor: 'mantine.colors.defaultBorder',
  // [titleColor]: '{colors.mantine.colors.dark[1]}',
  // [iconColor]: '{colors.mantine.colors.dimmed}',
  // [descriptionColor]: '{colors.mantine.colors.dimmed}',
  _hover: {
    ...buttonFocused,
    borderColor: 'mantine.colors.primary[9]',
    background: `mantine.colors.primary[8]/60`,
  },
  _focus: buttonFocused,
  [_treenodefocus]: buttonFocused,
  _dark: {
    borderColor: 'transparent',
    background: `mantine.colors.dark[6]/80`,
    // background: 'mantine.colors.dark[6]',
  },
  _light: {
    background: `mantine.colors.white/80`,
    // [iconColor]: '{colors.mantine.colors.gray[6]}',
    // [titleColor]: '{colors.mantine.colors.gray[7]}',
    _hover: {
      borderColor: 'mantine.colors.primary[6]',
      backgroundColor: 'mantine.colors.primary[5]',
      // [iconColor]: '{colors.mantine.colors.primary[3])',
      // [titleColor]: '{colors.mantine.colors.primary[0])',
      // [descriptionColor]: '{colors.mantine.colors.primary[1]}',
    },
  },
})

export const focusable = 'likec4-focusable'

const iconSize = {
  ref: 'var(--likec4-icon-size, 24px)',
}

const icon = css.raw({
  color: {
    base: 'mantine.colors.dimmed',
    _light: 'mantine.colors.gray[5]',
    _groupHover: 'mantine.colors.primary[0]',
    _groupFocus: 'mantine.colors.primary[0]',
  },
  [_treenodefocus]: {
    color: 'mantine.colors.primary[0]',
  },
  flex: `0 0 ${iconSize.ref}`,
  height: iconSize.ref,
  width: iconSize.ref,
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
    strokeWidth: 1.5,
  },
  // [iconSize]: '24px',
  // [whenContainerIsNarrow]: {
  //   [iconSize]: '18px',
  // },
})

const title = css.raw({
  fontSize: '16px',
  fontWeight: 500,
  lineHeight: '1.1',
  [`:where([data-disabled]) &`]: {
    opacity: 0.4,
  },

  color: {
    base: 'mantine.colors.dark[1]',
    _light: 'mantine.colors.gray[7]',
    _groupHover: {
      base: 'mantine.colors.primary[1]',
      _light: 'mantine.colors.white',
    },
    _groupFocus: {
      base: 'mantine.colors.primary[1]',
      _light: 'mantine.colors.white',
    },
  },
  [_treenodefocus]: {
    color: {
      base: 'mantine.colors.primary[1]',
      _light: 'mantine.colors.white',
    },
  },
})
const descriptionColor = css.raw({
  color: {
    base: 'mantine.colors.dimmed',
    _groupHover: {
      base: 'mantine.colors.primary[1]',
      _light: 'mantine.colors.primary[0]',
    },
    _groupFocus: 'mantine.colors.primary[0]',
  },
  [_treenodefocus]: {
    color: 'mantine.colors.primary[0]',
  },
})

const description = css.raw(descriptionColor, {
  marginTop: '[4px]',
  fontSize: '12px',
  lineHeight: '1.4',

  [`:where([data-disabled]) &`]: {
    opacity: 0.85,
  },
})

export const emptyBoX = css({
  width: '100%',
  height: '100%',
  border: `2px dashed`,
  borderColor: 'mantine.colors.defaultBorder',
  rounded: 'md',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: 'md',
  color: 'mantine.colors.dimmed',
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
