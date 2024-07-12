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
    ['--likec4-options-panel-top']: '60px',
    ['--likec4-options-panel-right']: '10px',
    ['--likec4-navigation-panel-top']: '0.8rem',
    ['--likec4-navigation-panel-left']: '3.2rem'
  }
})

export const cssExportView = style({
  boxSizing: 'border-box',
  border: '0px solid transparent',
  padding: 0,
  margin: 0,
  marginRight: 'auto',
  marginBottom: 'auto',
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
