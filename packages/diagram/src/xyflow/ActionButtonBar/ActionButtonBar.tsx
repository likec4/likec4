import { Box, type ActionIconProps } from "@mantine/core"
import { m, type HTMLMotionProps, type Variants } from "framer-motion"
import type { PropsWithoutRef } from "react"
import * as css from './ActionButtonBar.css'
import { ActionButton } from "../ActionButton/ActionButton"
import { IconFileSymlink, IconTransform, IconZoomScan } from "@tabler/icons-react"

const TRANSLATE_DIFF = 4;

type ShiftX = 'left' | 'spread' | 'right'
type ShiftY = 'top' | 'spread' | 'bottom'
type ShiftMode = number | 'spread'

type ActionButtonBarProps = PropsWithoutRef<
  ActionIconProps & HTMLMotionProps<'div'> & {
    keyPrefix: string
    shiftX?: ShiftX
    shiftY?: ShiftY
    onNavigateTo?: ((e: React.MouseEvent) => void) | false
    onOpenRelationships?: ((e: React.MouseEvent) => void) | false
    onOpenSource?: ((e: React.MouseEvent) => void) | false
  }
>

const elementVariants = (index: number, count: number, shiftX: ShiftMode, shiftY: ShiftMode) => {

  const translation = {
    x: shiftX === 'spread' ? 1 - count + index*2 : shiftX,
    y: shiftY === 'spread' ? 1 - count + index*2 : shiftY,
  }

  const variants = {
    idle: {
      scale: 1,
      opacity: 0.5,
      translateX: 0,
      translateY: 0
    },
    hovered: {
      scale: 1.32,
      opacity: 1,
      translateX: translation.x*TRANSLATE_DIFF,
      translateY: translation.y*TRANSLATE_DIFF
    },
    selected: {}
  } satisfies Variants
  variants['selected'] = variants['hovered']
  return variants
}

export const ActionButtonBar = ({
  keyPrefix,
  shiftX = 'spread',
  shiftY = 'spread',
  onNavigateTo,
  onOpenRelationships,
  onOpenSource,
  ...props
}: ActionButtonBarProps) => {

  // determine offsets for shifting
  let shiftDiffX: ShiftMode = 'spread'
  if (shiftX == 'left')
    shiftDiffX = -1
  else if (shiftX == 'right')
    shiftDiffX = 1

  let shiftDiffY: ShiftMode = 'spread'
  if (shiftY == 'top')
    shiftDiffY = -1
  else if (shiftY == 'bottom')
    shiftDiffY = 1

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
    }),

    (onOpenSource && {
      key: `${keyPrefix}:source`,
      onClick: onOpenSource,
      IconComponent: IconFileSymlink,
      tooltipLabel: 'Open source'
    })
  ].filter(b => !!b);

  // create the button elements
  const buttonElements = buttons.map(p => (<ActionButton {...props} {...p} />))

  return (
    <Box className={css.bottomButtonsContainer}
      component={m.div}>
      {buttonElements.map((element, i) => (
        <m.div
          key={i}
          variants={elementVariants(i, buttonElements.length, shiftDiffX, shiftDiffY)}
          {...props}
          >
          {element}
        </m.div>
      ))}
    </Box>
  )
}
