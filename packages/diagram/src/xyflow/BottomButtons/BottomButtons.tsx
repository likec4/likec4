import { ActionIcon, Box, type ActionIconProps } from "@mantine/core"
import { m, type HTMLMotionProps, type Variants } from "framer-motion"
import type { PropsWithoutRef } from "react"
import { stopPropagation } from "../utils"
import clsx from "clsx"
import { IconTransform, IconZoomScan } from "@tabler/icons-react"
import * as css from './BottomButtons.css'

const variantsBottomButton = (target: 'navigate' | 'relationships', align: 'left' | 'right' | false) => {
  const variants = {
    idle: {
      '--icon-scale': 'scale(1)',
      '--ai-bg': 'var(--ai-bg-idle)',
      scale: 1,
      opacity: 0.5,
      originX: 0.5,
      originY: 0.35,
      translateY: 0,
      ...align === 'left' && {
        originX: 0.75,
        translateX: -1
      },
      ...align === 'right' && {
        originX: 0.25,
        translateX: 1
      }
    },
    selected: {},
    hovered: {
      '--icon-scale': 'scale(1)',
      '--ai-bg': 'var(--ai-bg-hover)',
      translateY: 3,
      scale: 1.32,
      opacity: 1,
      ...align === 'left' && {
        translateX: -4
      },
      ...align === 'right' && {
        translateX: 4
      }
    },
    'hovered:details': {},
    [`hovered:${target}`]: {
      '--icon-scale': 'scale(1.08)',
      scale: 1.45
    },
    [`tap:${target}`]: {
      scale: 1.15
    }
  } satisfies Variants
  variants['selected'] = variants['hovered']
  variants['hovered:details'] = variants.idle
  return variants
}

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
  const enableRelationships = !!onOpenRelationships
  const enableNavigate = !!onNavigateTo

  if (!enableRelationships && !enableNavigate) {
    return null
  }

  return (
    <Box className={css.bottomButtonsContainer}>
      {enableNavigate && (
        <ActionIcon
          {...props}
          key={`${keyPrefix}navigate`}
          data-animate-target="navigate"
          component={m.div}
          // Weird, but dts-bundle-generator fails on "enableRelationships && 'left'"
          variants={variantsBottomButton('navigate', enableRelationships ? 'left' : false)}
          className={clsx('nodrag nopan', css.btn)}
          radius="md"
          role="button"
          onClick={onNavigateTo}
          onDoubleClick={stopPropagation}
        >
          <IconZoomScan
            style={{
              width: '70%',
              transform: 'var(--icon-scale)'
            }} />
        </ActionIcon>
      )}
      {enableRelationships && (
        <ActionIcon
          {...props}
          key={`${keyPrefix}relationships`}
          data-animate-target="relationships"
          component={m.div}
          variants={variantsBottomButton('relationships', enableNavigate ? 'right' : false)}
          className={clsx('nodrag nopan', css.btn)}
          radius="md"
          role="button"
          onClick={onOpenRelationships}
          onDoubleClick={stopPropagation}
        >
          <IconTransform
            style={{
              width: '70%',
              transform: 'var(--icon-scale)'
            }} />
        </ActionIcon>
      )}
    </Box>
  )
}
