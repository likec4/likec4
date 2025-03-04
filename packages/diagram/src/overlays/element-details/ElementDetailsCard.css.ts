import { rem } from '@mantine/core'
import { createVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { easings, mantine, transitions, vars, whereDark, whereLight } from '../../theme-vars'

export const cardBg = createVar('card-bg')
const cardBgImage = createVar('card-bg-top')

export const backdropBlur = createVar('backdrop-blur')
export const backdropOpacity = createVar('backdrop-opacity')

export const dialog = style({
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100vh',
  maxWidth: '100vw',
  maxHeight: '100vh',
  background: 'transparent',
  border: '0 solid transparent',
  vars: {
    [backdropOpacity]: '0%',
    [backdropBlur]: '0px',
  },
  selectors: {
    [`&::backdrop`]: {
      WebkitBackdropFilter: `blur(${backdropBlur})`,
      backdropFilter: `blur(${backdropBlur})`,
      backgroundColor: `rgb(36 36 36 / ${backdropOpacity})`,
    },
  },
})
export const card = style({
  position: 'absolute',
  pointerEvents: 'all',
  gap: mantine.spacing.lg,
  justifyContent: 'stretch',
  vars: {
    [cardBg]: mantine.colors.body,
    [cardBgImage]: `linear-gradient(180deg, ${vars.element.fill}, ${vars.element.fill} 4px, transparent 4px)`,
  },
  backgroundColor: cardBg,
  backgroundImage: cardBgImage,
  borderTopColor: vars.element.fill,
  selectors: {
    [`${whereDark} &`]: {
      vars: {
        [cardBg]: mantine.colors.dark[6],
        [cardBgImage]: `
          linear-gradient(180deg, color-mix(in srgb, ${vars.element.fill} 15%, transparent), transparent 80px),
          linear-gradient(180deg, ${vars.element.fill}, ${vars.element.fill} 4px, transparent 4px)
        `,
      },
    },
  },
})

export const cardHeader = style({
  flex: 0,
  cursor: 'move',
})

globalStyle(`:where(${card}) .react-flow__attribution`, {
  display: 'none',
})

export const title = style({
  display: 'block',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: 24,
  // lineHeight: 1.15,
  lineHeight: mantine.lineHeights.xs,
  // color: vars.element.hiContrast
})

const iconSize = '40px'
export const elementIcon = style({
  flex: `0 0 ${iconSize}`,
  height: iconSize,
  width: iconSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-start',
  cursor: 'move',
  selectors: {
    [`${whereDark} &`]: {
      mixBlendMode: 'hard-light',
    },
  },
})
globalStyle(`${elementIcon} svg, ${elementIcon} img`, {
  width: '100%',
  height: 'auto',
  maxHeight: '100%',
  pointerEvents: 'none',
  filter: `
    drop-shadow(0 0 3px rgb(0 0 0 / 10%))
    drop-shadow(0 1px 8px rgb(0 0 0 / 5%))
    drop-shadow(1px 1px 16px rgb(0 0 0 / 2%))
  `,
})
globalStyle(`${elementIcon} img`, {
  objectFit: 'contain',
})

const viewTitleColor = createVar('view-title-color')
const iconColor = createVar('icon-color')
export const viewButton = style({
  // display: 'flex',
  width: '100%',
  background: mantine.colors.body,
  borderRadius: mantine.radius.sm,
  padding: `10px 8px`,
  // gap: 6,
  // alignItems: 'flex-start',
  transition: transitions.fast,
  border: `1px solid ${mantine.colors.defaultBorder}`,
  vars: {
    [viewTitleColor]: mantine.colors.dark[1],
  },
  ':hover': {
    background: mantine.colors.defaultHover,
    vars: {
      [iconColor]: mantine.colors.dark[1],
      [viewTitleColor]: mantine.colors.defaultColor,
    },
  },
  selectors: {
    [`${whereDark} &`]: {
      background: mantine.colors.dark[6],
    },
    [`${whereLight} &`]: {
      vars: {
        [iconColor]: mantine.colors.gray[6],
        [viewTitleColor]: mantine.colors.gray[7],
      },
    },
    [`${whereLight} &:hover`]: {
      vars: {
        [iconColor]: mantine.colors.gray[7],
      },
    },
  },
})

globalStyle(`${viewButton} .mantine-ThemeIcon-root`, {
  transition: transitions.fast,
  color: fallbackVar(iconColor, mantine.colors.dark[2]),
  vars: {
    '--ti-size': '22px',
  },
})

globalStyle(`${viewButton} .mantine-ThemeIcon-root:hover`, {
  color: mantine.colors.defaultColor,
})

globalStyle(`${viewButton} > *`, {
  transition: `all 130ms ${easings.inOut}`,
})
globalStyle(`${viewButton}:hover > *`, {
  transitionTimingFunction: easings.out,
  transform: 'translateX(1.6px)',
})

export const viewButtonTitle = style({
  transition: transitions.fast,
  color: fallbackVar(viewTitleColor, mantine.colors.gray[7]),
  fontSize: 15,
  fontWeight: 500,
  lineHeight: 1.4,
})
// globalStyle(`${viewButton} .tabler-icon`, {
//   width: '85%',
// })
// globalStyle(`${viewButton} .tabler-icon`, {
//   width: '85%',
//   opacity: 0.75
// })

// globalStyle(`${whereLight} ${viewButton} .mantine-Button-label`, {
//   color: mantine.colors.dark[3]
// })

export const tabsRoot = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'stretch',
  overflow: 'hidden',
  gap: mantine.spacing.sm,
})

export const tabsList = style({
  // flex: '0',
  background: mantine.colors.gray[1],
  borderRadius: mantine.radius.sm,
  flexWrap: 'nowrap',
  gap: 6,
  padding: 4,
  selectors: {
    [`${whereDark} &`]: {
      background: mantine.colors.dark[7],
    },
  },
})

export const tabsTab = style({
  fontSize: mantine.fontSizes.xs,
  fontWeight: 500,
  flexGrow: 1,
  padding: '6px 8px',
  transition: transitions.fast,
  borderRadius: mantine.radius.sm,
  color: mantine.colors.gray[7],
  ':hover': {
    transitionTimingFunction: easings.out,
    color: mantine.colors.defaultColor,
    background: mantine.colors.gray[3],
  },
  selectors: {
    ['&[data-active]']: {
      transition: 'none',
      background: mantine.colors.white,
      boxShadow: mantine.shadows.xs,
      color: mantine.colors.defaultColor,
    },
    [`${whereDark} &`]: {
      color: mantine.colors.dark[1],
    },
    [`${whereDark} &:hover`]: {
      color: mantine.colors.white,
      background: mantine.colors.dark[6],
    },
    [`${whereDark} &:is([data-active])`]: {
      color: mantine.colors.white,
      background: mantine.colors.dark[5],
    },
  },
})

export const tabsPanel = style({
  flex: 1,
  overflow: 'hidden',
  position: 'relative',
})

globalStyle(`${tabsPanel}:not(:has(.mantine-ScrollArea-root))`, {
  paddingLeft: 4,
  paddingRight: 4,
})
globalStyle(`${tabsPanel} .mantine-ScrollArea-root`, {
  width: '100%',
  height: '100%',
})
globalStyle(`${tabsPanel} .mantine-ScrollArea-viewport > div`, {
  paddingLeft: 4,
  paddingRight: 4,
})

export const propertiesGrid = style({
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'min-content 1fr',
  gridAutoRows: 'min-content max-content',
  gap: `${rem(20)} ${rem(16)}`,
  alignItems: 'baseline',
  justifyItems: 'stretch',
})

export const propertyLabel = style({
  justifySelf: 'end',
})

export const resizeHandle = style({
  position: 'absolute',
  width: 14,
  height: 14,
  border: `3.5px solid ${mantine.colors.dark[3]}`,
  borderTop: 'none',
  borderLeft: 'none',
  borderRadius: 2,
  bottom: 2,
  right: 2,
  transition: transitions.fast,
  cursor: 'se-resize',
  ':hover': {
    borderWidth: 4,
    borderColor: mantine.colors.dark[1],
  },
})
