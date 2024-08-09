import { globalStyle, style } from '@vanilla-extract/css'

globalStyle('*, :before, :after', {
  boxSizing: 'border-box',
  outline: 'none',
  borderWidth: '0',
  borderStyle: 'solid',
  borderColor: 'transparent'
})

globalStyle('html, body, #root', {
  width: '100%',
  height: '100%',
  minHeight: '100vh',
  padding: '0',
  margin: '0'
})
globalStyle('body', {
  vars: {
    '--likec4-default-font-family':
      `"IBM Plex Sans",ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`,
    '--mantine-default-font-family': 'var(--likec4-default-font-family)',
    '--mantine-font-family': 'var(--likec4-default-font-family)',
    '--mantine-color-body': 'var(--vscode-editor-background )',
    '--likec4-background-color': 'var(--vscode-editor-background )'
  }
})

export const likec4Container = style({
  position: 'fixed',
  inset: '0',
  overflow: 'hidden',
  vars: {
    // '--likec4-background-color': 'var(--vscode-editor-background )',
    '--likec4-options-panel-top': '2.5rem'
  }
  // selectors: {
  //   [`:where([data-mantine-color-scheme='dark']) &`]: {
  //     vars: {
  //       '--xy-background-pattern-color': 'var(--mantine-color-dark-2)'
  //     }
  //   }
  // }
})

globalStyle(`${likec4Container} .react-flow`, {
  vars: {
    '--xy-background-pattern-color': 'var(--mantine-color-dark-8 )'
  }
})
globalStyle(`:where([data-mantine-color-scheme='dark']) ${likec4Container} .react-flow`, {
  vars: {
    '--xy-background-pattern-color': 'var(--mantine-color-dark-2)'
  }
})

export const likec4error = style({
  position: 'absolute',
  left: '2rem',
  bottom: '2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: '0 2rem',
  backgroundColor: 'var(--vscode-inputValidation-errorBackground)',
  border: '1px solid var(--vscode-inputValidation-errorBorder)',
  color: 'var(--vscode-errorForeground)'
})

export const likec4ParsingScreen = style({
  padding: '1rem'
})

globalStyle(`${likec4ParsingScreen} section`, {
  marginTop: '1rem',
  marginBottom: '1rem'
})

globalStyle('.react-flow .react-flow__attribution', {
  display: 'none'
})

globalStyle(`.mantine-ActionIcon-icon .tabler-icon`, {
  width: '75%',
  height: '75%'
})
