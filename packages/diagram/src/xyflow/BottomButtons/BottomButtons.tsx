import { Box, type ActionIconProps } from "@mantine/core"
import { type HTMLMotionProps } from "framer-motion"
import type { PropsWithoutRef } from "react"
import * as css from './BottomButtons.css'
import { ActionButton } from "../ActionButton/ActionButton"
import { IconTransform, IconZoomScan } from "@tabler/icons-react"

type BottomButtonsProps = PropsWithoutRef<
  ActionIconProps & HTMLMotionProps<'div'> & {
    keyPrefix: string
    onNavigateTo: ((e: React.MouseEvent) => void) | false
    onOpenRelationships: ((e: React.MouseEvent) => void) | false
  }
>

export const BottomButtons = ({
  keyPrefix,
  onNavigateTo,
  onOpenRelationships,
  ...props
}: BottomButtonsProps) => {

  // define the buttons based on the given actions
  const buttons = [

    (onNavigateTo && {
      key: `${keyPrefix}:navigate`,
      onClick: onNavigateTo,
      IconComponent: IconZoomScan
    }),

    (onOpenRelationships && {
      key: `${keyPrefix}:relationships`,
      onClick: onOpenRelationships,
      IconComponent: IconTransform,
      tooltipLabel: 'Browse relationships'
    })
  ].filter(b => !!b);

  // compute the button's translations when popping out
  const buttonElementProps = buttons.map((b, i) => ({
    ...b,
    translate: {
      x: (1 - buttons.length)/2 + i,
      y: 1
    }
  }));

  // create the button elements
  const buttonElements = buttonElementProps.map(p => (<ActionButton {...props} {...p} />))

  return (
    <Box className={css.bottomButtonsContainer}>
      {buttonElements}
    </Box>
  )
}
