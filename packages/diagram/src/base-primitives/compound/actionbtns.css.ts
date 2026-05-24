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
          base: 'normal',
          _hover: '0',
        },
      },
    },
  },
})
