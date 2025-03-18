import { css } from '@likec4/styles/css'

export const likec4Container = css({
  position: 'fixed',
  inset: '0',
  overflow: 'hidden',
  '--likec4-options-panel-top': '0.5rem',
  '--likec4-navigation-panel-top': '0.25rem',
  '--likec4-navigation-panel-left': '0.25rem',
  '& .likec4-top-left-panel .action-icon': {
    ['--ai-size']: 'var(--ai-size-md)',
  },
})

// export const likec4error = style({
//   position: 'absolute',
//   left: '2rem',
//   bottom: '2rem',
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   flexDirection: 'column',
//   padding: '0 2rem',
//   backgroundColor: 'var(--vscode-inputValidation-errorBackground)',
//   border: '1px solid var(--vscode-inputValidation-errorBorder)',
//   color: 'var(--vscode-errorForeground)'
// })

export const likec4ParsingScreen = css({
  padding: '1rem',
  '& section': {
    marginTop: '1rem',
    marginBottom: '1rem',
  },
})

export const stateAlert = css({
  position: 'absolute',
  top: '0.75rem',
  left: '0.5rem',
  userSelect: 'none',
})
