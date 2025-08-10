import { cva } from '@likec4/styles/css'

export const compoundActionBtn = cva({
  base: {
    transitionDuration: 'normal',
  },
  variants: {
    delay: {
      true: {
        // Debounce CSS transition
        transitionDelay: {
          base: '0.2s',
          _hover: '0s',
        },
      },
    },
  },
})
