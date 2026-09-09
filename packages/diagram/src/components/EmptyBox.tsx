import { isCssProperty, styled } from '@likec4/styles/jsx'
import { emptyBox } from '@likec4/styles/recipes'

export const EmptyBox = styled('div', emptyBox, {
  shouldForwardProp(prop, variantKeys) {
    return !variantKeys.includes(prop) && !isCssProperty(prop)
  },
})
