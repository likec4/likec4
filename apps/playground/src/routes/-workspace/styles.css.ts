import { globalStyle, style } from '@vanilla-extract/css'

export const monacoEditor = style({
  width: '100%',
  height: '100%'
})

// globalStyle(`${monacoEditor} .monaco-editor`, {
//   vars: {
//     ['--vscode-editor-background']: mantine.colors.body,
//   }
// })

export const diagramTitle = style({
  position: 'absolute',
  top: '0.75rem',
  left: '0.5rem',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  userSelect: 'none',
  textShadow: '1px 2px 2px rgba(0, 0, 0, 0.2)'
})

export const stateAlert = style({
  position: 'absolute',
  top: '0.75rem',
  left: '0.5rem',
  userSelect: 'none'
})

globalStyle(`${stateAlert} .mantine-Notification-description`, {
  whiteSpace: 'pre-line'
})
