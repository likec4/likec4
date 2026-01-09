import { createStyleContext, isCssProperty } from '@likec4/styles/jsx'
import { navigationPanel } from '@likec4/styles/recipes'
import { type ForwardRefComponent, type HTMLMotionProps, isValidMotionProp } from 'motion/react'
import * as m from 'motion/react-m'

const { withProvider, withContext } = createStyleContext(navigationPanel)

const shouldForwardProp = (prop: string, variantKeys: string[]): boolean =>
  !variantKeys.includes(prop) && (isValidMotionProp(prop) || !isCssProperty(prop))

const Root = withProvider(m.div as ForwardRefComponent<'div', HTMLMotionProps<'div'>>, 'root', {
  shouldForwardProp,
})
const Body = withContext(m.div as ForwardRefComponent<'div', HTMLMotionProps<'div'>>, 'body', {
  shouldForwardProp,
})

const Label = withContext(m.div as ForwardRefComponent<'div', HTMLMotionProps<'div'>>, 'label', {
  shouldForwardProp,
})
const Dropdown = withContext(m.div as ForwardRefComponent<'div', HTMLMotionProps<'div'>>, 'dropdown', {
  shouldForwardProp,
})

export const NavigationPanel = {
  Root,
  Body,
  Label,
  Dropdown,
}
