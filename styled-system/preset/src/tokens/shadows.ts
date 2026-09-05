import { defineTokens } from '@pandacss/dev'

export const shadows = defineTokens.shadows({
  none: { value: 'none' },
  xs: {
    value: '0 1px 3px rgb(0 0 0/5%), 0 1px 2px rgb(0 0 0/10%)',
  },
  sm: {
    value: '0 1px 3px rgb(0 0 0/5%), 0 10px 15px -5px rgb(0 0 0/5%), 0 7px 7px -5px rgb(0 0 0/4%)',
  },
  md: {
    value: '0 1px 3px rgb(0 0 0/5%), 0 20px 25px -5px rgb(0 0 0/5%), 0 10px 10px -5px rgb(0 0 0/4%)',
  },
  lg: {
    value: '0 1px 3px rgb(0 0 0/5%), 0 28px 23px -7px rgb(0 0 0/5%), 0 12px 12px -7px rgb(0 0 0/4%)',
  },
  xl: {
    value: '0 1px 3px rgb(0 0 0/5%), 0 36px 28px -7px rgb(0 0 0/5%), 0 17px 17px -7px rgb(0 0 0/4%)',
  },
})
