import { css } from '@likec4/styles/css'

export const backdropBlur = '--_blur'
export const backdropOpacity = '--_opacity'

export const dialog = css({
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100vh',
  maxWidth: '100vw',
  maxHeight: '100vh',
  background: '[transparent]',
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
  gap: 'lg',
  justifyContent: 'stretch',
  backgroundColor: 'mantine.colors.body',
  backgroundImage:
    `linear-gradient(180deg, {colors.likec4.palette.fill}, {colors.likec4.palette.fill} 4px, transparent 4px)`,
  borderTopColor: 'likec4.palette.fill',
  _dark: {
    backgroundColor: `mantine.colors.dark[6]`,
    backgroundImage: `
          linear-gradient(180deg, color-mix(in srgb, {colors.likec4.palette.fill} 15%, transparent), transparent 80px),
          linear-gradient(180deg, {colors.likec4.palette.fill}, {colors.likec4.palette.fill} 4px, transparent 4px)
        `,
  },
  '& .react-flow__attribution': {
    display: 'none',
  },
})

export const cardHeader = css({
  flex: 0,
  cursor: 'move',
})

export const title = css({
  display: 'block',
  fontFamily: 'likec4.element',
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '24px',
  // lineHeight: 1.15,
  lineHeight: 'xs',
  // color: vars.element.hiContrast
})

const iconSize = '40px'
export const elementIcon = css({
  flex: `0 0 ${iconSize}`,
  height: iconSize,
  width: iconSize,
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
    filter: `
    drop-shadow(0 0 3px rgb(0 0 0 / 10%))
    drop-shadow(0 1px 8px rgb(0 0 0 / 5%))
    drop-shadow(1px 1px 16px rgb(0 0 0 / 2%))
  `,
  },
  '& img': {
    objectFit: 'contain',
  },
})

const viewTitleColor = '--view-title-color'
const iconColor = '--icon-color'
export const viewButton = css({
  // display: 'flex',
  width: '100%',
  background: 'mantine.colors.body',
  borderRadius: 'sm',
  padding: `10px 8px`,
  // gap: 6,
  // alignItems: 'flex-start',
  transition: 'fast',
  border: `1px dashed`,
  borderColor: 'mantine.colors.defaultBorder',
  [viewTitleColor]: '{colors.mantine.colors.dark[1]}',
  _hover: {
    background: 'mantine.colors.defaultHover',
    [iconColor]: '{colors.mantine.colors.dark[1]}',
    [viewTitleColor]: '{colors.mantine.colors.defaultColor}',
  },
  _dark: {
    background: 'mantine.colors.dark[6]',
  },
  _light: {
    [iconColor]: '{colors.mantine.colors.gray[6]}',
    [viewTitleColor]: '{colors.mantine.colors.gray[7]}',
    _hover: {
      [iconColor]: '{colors.mantine.colors.gray[7]}',
    },
  },

  '& .mantine-ThemeIcon-root': {
    transition: 'fast',
    // color: fallbackVar(iconColor, 'mantine.colors.dark[2])',
    color: `[var(${iconColor}, {colors.mantine.colors.dark[2]})]`,
    '--ti-size': '22px',
    _hover: {
      color: 'mantine.colors.defaultColor',
    },
  },

  '& > *': {
    transition: `all 130ms {easings.inOut}`,
  },
  '&:hover > *': {
    transitionTimingFunction: 'out',
    transform: 'translateX(1.6px)',
  },
})

export const viewButtonTitle = css({
  transition: 'fast',
  color: `[var(${viewTitleColor}, {colors.mantine.colors.gray[7]})]`,
  fontSize: '15px',
  fontWeight: 500,
  lineHeight: '1.4',
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

export const tabsRoot = css({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'stretch',
  overflow: 'hidden',
  gap: 'sm',
})

export const tabsList = css({
  // flex: '0',
  background: 'mantine.colors.gray[1]',
  borderRadius: 'sm',
  flexWrap: 'nowrap',
  gap: '6px',
  padding: '4px',
  _dark: {
    background: 'mantine.colors.dark[7]',
  },
})

export const tabsTab = css({
  fontSize: 'xs',
  fontWeight: 500,
  flexGrow: 1,
  padding: '6px 8px',
  transition: 'fast',
  borderRadius: 'sm',
  color: 'mantine.colors.gray[7]',
  _hover: {
    transitionTimingFunction: 'out',
    color: 'mantine.colors.defaultColor',
    background: 'mantine.colors.gray[3]',
  },
  ['&[data-active]']: {
    transition: 'none',
    background: 'mantine.colors.white',
    shadow: 'xs',
    color: 'mantine.colors.defaultColor',
  },
  _dark: {
    color: 'mantine.colors.dark[1]',
    _hover: {
      color: 'mantine.colors.white',
      background: 'mantine.colors.dark[6]',
    },

    [`&:is([data-active])`]: {
      color: 'mantine.colors.white',
      background: 'mantine.colors.dark[5]',
    },
  },
})

export const tabsPanel = css({
  flex: 1,
  overflow: 'hidden',
  position: 'relative',
  '&:not(:has(.mantine-ScrollArea-root))': {
    paddingLeft: '4px',
    paddingRight: '4px',
  },
  '& .mantine-ScrollArea-root': {
    width: '100%',
    height: '100%',
    '& > div': {
      paddingLeft: '4px',
      paddingRight: '4px',
    },
  },
})

export const propertiesGrid = css({
  flex: 1,
  display: 'grid',
  gridTemplateColumns: 'min-content 1fr',
  gridAutoRows: 'min-content max-content',
  gap: `[20px 16px]`,
  alignItems: 'baseline',
  justifyItems: 'stretch',
})

export const propertyLabel = css({
  justifySelf: 'end',
})

export const resizeHandle = css({
  position: 'absolute',
  width: '14px',
  height: '14px',
  border: `3.5px solid`,
  borderColor: 'mantine.colors.dark[3]',
  borderTop: 'none',
  borderLeft: 'none',
  borderRadius: '2px',
  bottom: '2px',
  right: '2px',
  transition: 'fast',
  cursor: 'se-resize',
  _hover: {
    borderWidth: '4px',
    borderColor: 'mantine.colors.dark[1]',
  },
})
