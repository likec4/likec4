import { createVar, globalStyle, style } from '@vanilla-extract/css'

// Index page

export const cssPreviewCardLink = style({
  position: 'absolute',
  inset: 0,
  zIndex: 1
})

//

export const svgContainer = style({
  minWidth: 300
})

globalStyle(`${svgContainer} svg`, {
  width: '100%',
  height: 'auto'
})

export const headerHeight = createVar('header-height')

export const cssViewOutlet = style({
  padding: 0,
  margin: 0,
  // paddingTop: headerHeight,
  width: '100%',
  height: '100%',
  // position: 'absolute',
  // top: headerHeight,
  // left: 0,
  // width: '100vw',
  // height: `calc(100vh - ${headerHeight})`
  vars: {
    [headerHeight]: '60px',
    // TODO: temporary hack to fix the navigation panel position
    ['--likec4-navigation-panel-top']: '0.8rem',
    ['--likec4-navigation-panel-left']: '3rem'
  }
})

export const cssExportView = style({
  position: 'fixed',
  boxSizing: 'border-box',
  border: '0px solid transparent',
  top: 0,
  left: 0,
  right: 0,
  width: '100%',
  height: '100%',
  padding: 0,
  background: 'transparent'
})
export const cssExportBox = style({
  padding: 0,
  margin: 0
})

export const cssWebcomponentView = style({
  position: 'fixed',
  inset: 0,
  width: '100%',
  height: '100%'
})

export const cssWebcomponentIframeContainer = style({
  flex: 1,
  width: '100%',
  height: '100%',
  overflow: 'hidden'
})

globalStyle(`${cssWebcomponentIframeContainer} iframe`, {
  width: '100%',
  height: '100%',
  borderStyle: 'none',
  backgroundColor: 'transparent',
  overflow: 'hidden'
})
// globalStyle(`${cssWebcomponentView} iframe html`, {
//   // width: '100%',
//   // height: '100%',
//   // border: '0',
//     backgroundColor: 'var(--mantine-color-body)'
// })
