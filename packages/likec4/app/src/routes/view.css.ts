import { globalStyle, style } from '@vanilla-extract/css'
import { headerHeight } from '../components/view-page/Header.css'

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

export const cssViewOutlet = style({
  padding: 0,
  margin: 0,
  paddingTop: headerHeight,
  width: '100%',
  height: '100%'
  // position: 'absolute',
  // top: headerHeight,
  // left: 0,
  // width: '100vw',
  // height: `calc(100vh - ${headerHeight})`
})
export const cssCaptureGesturesLayer = style({
  position: 'absolute',
  top: headerHeight,
  left: 0,
  width: 40,
  height: 'calc(100vh - 170px)',
  zIndex: 1
})

export const cssExportView = style({
  position: 'fixed',
  boxSizing: 'border-box',
  inset: 0,
  width: '100vw',
  height: '100vh',
  padding: 0,
  background: 'transparent'
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
