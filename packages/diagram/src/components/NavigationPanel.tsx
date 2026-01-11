import { cx } from '@likec4/styles/css'
import { createStyleContext, isCssProperty } from '@likec4/styles/jsx'
import { navigationPanel } from '@likec4/styles/recipes'
import { type ForwardRefComponent, type HTMLMotionProps, isValidMotionProp } from 'motion/react'
import * as m from 'motion/react-m'
import { type HTMLAttributes, forwardRef } from 'react'
import { Logo as LogoWithText, LogoIcon } from './Logo'

const { withProvider, withContext } = createStyleContext(navigationPanel)

const shouldForwardProp = (prop: string, variantKeys: string[]): boolean =>
  !variantKeys.includes(prop) && (isValidMotionProp(prop) || !isCssProperty(prop))

const LogoButton = forwardRef<HTMLButtonElement, HTMLAttributes<HTMLButtonElement>>(({ className, ...props }, ref) => {
  return (
    <button
      {...props}
      ref={ref}
      className={cx(
        'mantine-active',
        className,
      )}
    >
      {/* These attributes are used by preset to conditionally render the icon */}
      <LogoIcon data-logo-icon />
      <LogoWithText data-logo-full />
    </button>
  )
})

const Root = withProvider(m.div as ForwardRefComponent<'div', HTMLMotionProps<'div'>>, 'root', {
  shouldForwardProp,
})
const Body = withContext(m.div as ForwardRefComponent<'div', HTMLMotionProps<'div'>>, 'body', {
  shouldForwardProp,
})
const Logo = withContext(LogoButton, 'logo')

const Label = withContext(m.div as ForwardRefComponent<'div', HTMLMotionProps<'div'>>, 'label', {
  shouldForwardProp,
})
const Dropdown = withContext(m.div as ForwardRefComponent<'div', HTMLMotionProps<'div'>>, 'dropdown', {
  shouldForwardProp,
})

export const NavigationPanel = {
  Root,
  Body,
  Logo,
  Label,
  Dropdown,
}
