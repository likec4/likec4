import { blackA, mauve } from '@radix-ui/colors'
import { style } from '@vanilla-extract/css'

export const dialogOverlay = style({
  backgroundColor: blackA.blackA9,
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  backdropFilter: 'blur(3px)'
})

export const dialogContent = style({
  backgroundColor: 'white',
  borderRadius: 6,
  boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: '90vw',
  maxHeight: '85vh',
  padding: 25,
  zIndex: 101,
  ':focus': {
    outline: 'none'
  }
})

export const dialogTitle = style({
  margin: 0,
  fontWeight: 500,
  color: mauve.mauve12,
  fontSize: 17
})

export const dialogDescription = style({
  margin: '10px 0 20px',
  color: mauve.mauve11,
  fontSize: 15,
  lineHeight: 1.5
})

export const flex = style({ display: 'flex' })
