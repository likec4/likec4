import { style } from '@vanilla-extract/css'

// export const navsidebar = style({
//   backdropFilter: 'blur(6px)',
//   transition: 'transform 0.21s cubic-bezier(0.4,0,0.2,1)',
//   transform: 'translateX(-100%)',
//   '::before': {
//     transition: 'all 0.26s ease-in-out',
//     position: 'absolute',
//     content: '',
//     inset: '0',
//     background: 'var(--gray-7)',
//     opacity: '0.7',
//     zIndex: '1'
//   },
//   'selectors': {
//     '& > div': {
//       position: 'relative',
//       zIndex: '2'
//     },
//     '&[data-opened=\'true\']': {
//       transform: 'translateX(0)'
//     }
//   }
// })

// export const trigger = style({
//   cursor: 'pointer',
//   '::before': {
//     transitionProperty: 'all',
//     transitionTimingFunction: 'cubic-bezier(0,0.31,0,1.03)',
//     transitionDuration: '140ms',
//     position: 'absolute',
//     content: '',
//     inset: '0',
//     background: 'var(--gray-7)',
//     opacity: '0',
//     zIndex: '1'
//   },
//   'selectors': {
//     '& > *': {
//       position: 'relative',
//       zIndex: '2'
//     },
//     '&:hover::before': {
//       visibility: 'visible',
//       opacity: '0.7'
//     },
//     '&[data-opened=\'true\']': {
//       visibility: 'hidden'
//     }
//   }
// })

export const diagramPreview = style({
  pointerEvents: 'none'
})
