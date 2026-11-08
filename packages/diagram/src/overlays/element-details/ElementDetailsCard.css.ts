// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
import { css, sva } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'

export const backdropBlur = '--_blur'
export const backdropOpacity = '--_opacity'

export const dialog = css({
  boxSizing: 'border-box',
  margin: '0',
  padding: '0',
  position: 'fixed',
  inset: '0',
  width: '100vw',
  height: '100vh',
  maxWidth: '100vw',
  maxHeight: '100vh',
  background: 'transparent',
  border: 'transparent',
  _backdrop: {
    // WebkitBackdropFilter: `blur(${backdropBlur})`,
    backdropFilter: 'auto',
    backdropBlur: `var(${backdropBlur})`,
    backgroundColor: `[rgb(36 36 36 / var(${backdropOpacity}, 5%))]`,
  },
})
export const card = css({
  position: 'absolute',
  pointerEvents: 'all',
  display: 'flex',
  flexDirection: 'column',
  padding: '4',
  gap: 'lg',
  justifyContent: 'stretch',
  color: 'text',
  boxShadow: 'md',
  overflow: 'hidden',
  border: 'none',
  background: `[
    linear-gradient(180deg,
    color-mix(in oklab, var(--likec4-palette-fill) 60%, transparent),
    color-mix(in oklab, var(--likec4-palette-fill) 20%, transparent) 8px,
    color-mix(in oklab, var(--likec4-palette-fill) 14%, transparent) 20px,
    transparent 80px
    ),
    linear-gradient(180deg, var(--likec4-palette-fill), var(--likec4-palette-fill) 4px, transparent 4px),
    {colors.likec4.overlay.body}
  ]`,
  '& .react-flow__attribution': {
    display: 'none',
  },
})

export const cardHeader = css({
  flex: '[0]',
  cursor: 'move',
})

export const ElementTitle = styled('div', {
  base: {
    fontFamily: 'likec4.element',
    fontOpticalSizing: 'auto',
    fontStyle: 'normal',
    fontWeight: 'bold',
    fontSize: 'h2',
    lineHeight: 'xs',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordBreak: 'break-word',
    lineClamp: 2,
  },
})

const iconSize = '40px'
export const elementIcon = css({
  flex: `[0 0 ${iconSize}]`,
  boxSize: `[${iconSize}]`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-start',
  cursor: 'move',
  _dark: {
    mixBlendMode: 'hard-light',
  },
  '& :where(svg, img)': {
    width: '100%',
    height: 'auto',
    maxHeight: '100%',
    pointerEvents: 'none',
    filter: `[
    drop-shadow(0 0 3px rgb(0 0 0 / 10%))
    drop-shadow(0 1px 8px rgb(0 0 0 / 5%))
    drop-shadow(1px 1px 16px rgb(0 0 0 / 2%))
  ]`,
  },
  '& img': {
    objectFit: 'contain',
  },
})

const viewTitleColor = '--view-title-color'
const iconColor = '--icon-color'
export const viewButton = hstack({
  flexWrap: 'nowrap',
  width: '100%',
  background: 'surface.default',
  borderRadius: 'sm',
  padding: `[10px 8px]`,
  gap: '2',
  transition: 'fast',
  border: `default`,
  borderStyle: 'dashed',
  [viewTitleColor]: '{colors.mantine.dark[1]}',
  _hover: {
    background: 'surface.hover',
    [iconColor]: '{colors.mantine.dark[1]}',
    [viewTitleColor]: '{colors.text}',
  },
  _light: {
    [iconColor]: '{colors.mantine.gray[6]}',
    [viewTitleColor]: '{colors.mantine.gray[7]}',
    _hover: {
      [iconColor]: '{colors.mantine.gray[7]}',
    },
  },

  '& .mantine-ThemeIcon-root': {
    transition: 'fast',
    // color: fallbackVar(iconColor, 'mantine.dark[2])',
    color: `[var(${iconColor}, {colors.mantine.dark[2]})]`,
    '--ti-size': '22px',
    _hover: {
      color: 'text',
    },
  },

  '& > *': {
    transition: `[all 130ms {easings.inOut}]`,
  },
})

export const ViewButtonTitle = styled('div', {
  base: {
    transition: 'fast',
    color: `[var(${viewTitleColor}, {colors.mantine.gray[7]})]`,
    fontSize: '[15px]',
    fontWeight: 'medium',
    lineHeight: '[1.4]',
    lineClamp: 1,
  },
})

// Properties tab: description reads as the main pane, facts sit in a sidebar (see PropertiesSplit)
export const propertiesMain = css({
  height: '100%',
  // align the article with the card's left edge (icon, tabs, footer)
  '& > .mantine-ScrollArea-viewport': {
    paddingLeft: '0!',
  },
})

export const propertiesSidebar = css({
  width: '100%',
  height: '100%',
  borderRadius: 'md',
  backgroundColor: 'surface.sunken',
  '& > .mantine-ScrollArea-viewport': {
    padding: '3!',
  },
})

export const facts = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
})

export const factLabel = css({
  textStyle: 'fieldLabel',
  margin: '0',
  marginBottom: '2',
})

export const factValues = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1',
  fontSize: 'md',
})

export const technologyBadge = css({
  minHeight: '[24px]',
  backgroundColor: 'transparent',
})

export const resizeHandle = css({
  position: 'absolute',
  boxSize: '[14px]',
  border: `[3.5px solid {colors.mantine.dark[3]}]`,
  borderTop: 'none',
  borderLeft: 'none',
  borderRadius: 'xs',
  bottom: '0.5',
  right: '0.5',
  transition: 'fast',
  cursor: '[se-resize]',
  _hover: {
    borderWidth: '[4px]',
    borderColor: 'mantine.dark[1]',
  },
})

export const tabs = sva({
  className: 'likec4-details-tabs',
  slots: ['root', 'list', 'tab', 'panel', 'tabSection', 'tabLabel'],
  base: {
    root: {
      display: 'flex',
      flex: '1',
      flexDirection: 'column',
      justifyContent: 'stretch',
      overflow: 'hidden',
      gap: 'sm',
    },
    list: {
      background: 'surface.sunken',
      borderRadius: 'sm',
      flexWrap: 'nowrap',
      gap: '1.5', // 6px
      padding: '1',
    },
    tab: {
      fontSize: 'xs',
      fontWeight: 'medium',
      flexGrow: 1,
      padding: '[6px 8px]',
      transition: 'fast',
      borderRadius: 'sm',
      color: 'mantine.gray[7]',
      _hover: {
        transitionTimingFunction: 'out',
        color: 'text',
        background: 'mantine.gray[3]',
      },
      ['&[data-active]']: {
        transition: 'none',
        background: 'white',
        shadow: 'xs',
        color: 'text',
      },
      _dark: {
        color: 'mantine.dark[1]',
        _hover: {
          color: 'white',
          background: 'mantine.dark[6]',
        },

        [`&:is([data-active])`]: {
          color: 'white',
          background: 'mantine.dark[5]',
        },
      },
    },
    panel: {
      flex: '1',
      overflow: 'hidden',
      position: 'relative',
      '&:not(:has(.mantine-ScrollArea-root))': {
        paddingLeft: '1',
        paddingRight: '1',
      },
      '& .mantine-ScrollArea-root': {
        width: '100%',
        height: '100%',
        '& > div': {
          paddingLeft: '1',
          paddingRight: '1',
        },
      },
    },
    tabLabel: {
      fontSize: 'xxs',
      fontFamily: 'body',
      textTransform: 'uppercase',
      fontWeight: 'medium',
      letterSpacing: 'caps.sm',
    },
  },
})

export const CardFooter = styled('div', {
  base: {
    flex: '[0]',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 'lg',
    rowGap: 'xs',
    marginTop: '[-8px]',
    paddingTop: 'xs',
    borderTop: 'subtle',
  },
})

export const CardFooterSection = styled('div', {
  base: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1',
    minWidth: '0',
  },
  variants: {
    full: {
      true: {
        flex: '1',
        overflow: 'hidden',
      },
    },
  },
})
