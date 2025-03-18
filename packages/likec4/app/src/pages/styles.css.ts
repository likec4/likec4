// import { createVar, globalStyle, style } from '@vanilla-extract/css'

import { css } from '@likec4/styles/css'
import { cssVar } from '@likec4/styles/vars'

// Index page

export const cssPreviewCardLink = css({
  position: 'absolute',
  inset: 0,
  zIndex: 1,
})

//

export const svgContainer = css({
  minWidth: 300,
  '& svg': {
    width: '100%',
    height: 'auto',
  },
})

export const headerHeight = cssVar.create('header-height')

export const cssViewOutlet = css({
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
  [headerHeight.var]: '60px',
  // TODO: temporary hack to fix the navigation webview position
  ['--likec4-options-panel-top']: '60px',
  ['--likec4-options-panel-right']: '10px',
  // ['--likec4-navigation-webview-top']: '0.8rem',
  // ['--likec4-navigation-webview-left']: '3.2rem'
})

export const cssExportView = css({
  boxSizing: 'border-box',
  border: '0px solid transparent',
  padding: 0,
  margin: 0,
  marginRight: 'auto',
  marginBottom: 'auto',
  background: 'transparent',
})

export const cssWebcomponentView = css({
  position: 'fixed',
  inset: 0,
  width: '100%',
  height: '100%',
})

export const cssWebcomponentIframeContainer = css({
  flex: 1,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  '& iframe': {
    width: '100%',
    height: '100%',
    borderStyle: 'none',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
})
