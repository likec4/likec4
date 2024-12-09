import { ActionIcon, Box, Group, Tooltip, type ActionIconProps } from "@mantine/core"
import type { HTMLMotionProps, Variants } from "framer-motion"
import * as css from './BottomButtons.css'
import { m } from 'framer-motion'
import { stopPropagation } from "../../utils"
import { IconFileSymlink, IconTransform, IconZoomScan } from "@tabler/icons-react"

const ActionIconButton = ActionIcon.withProps({
  component: m.div,
  className: 'nodrag nopan ' + css.bottomButton,
  radius: 'md',
  role: 'button',
  onDoubleClick: stopPropagation,
  onPointerDownCapture: stopPropagation
});

type BottomButtonsProps = ActionIconProps & HTMLMotionProps<'div'> & {
  onNavigateTo?: ((e: React.MouseEvent) => void) | false | null
  onOpenRelationships?: ((e: React.MouseEvent) => void) | false | null
  onOpenSource?: ((e: React.MouseEvent) => void) | false | null
}

const rootVariants = {
  idle: {
    gap: 0
  },
  hovered: {
    gap: 16
  },
  selected: {}
} satisfies Variants
rootVariants['selected'] = rootVariants['hovered'];

const actionIconVariants = (target: 'navigate' | 'relationships' | 'openSource') => {
  const variants = {
    idle: {
      '--icon-scale': 'scale(1)',
      '--ai-bg': 'var(--ai-bg-idle)',
      scale: 1,
      opacity: 0.5,
      originX: 0.5,
      originY: 0.35,
      translateY: 0
    },
    selected: {},
    hovered: {
      '--icon-scale': 'scale(1)',
      '--ai-bg': 'var(--ai-bg-hover)',
      translateY: 3,
      scale: 1.32,
      opacity: 1
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

export const BottomButtons = ({
  onNavigateTo,
  onOpenRelationships,
  onOpenSource
}: BottomButtonsProps) => {
  const enableNavigate = !!onNavigateTo;
  const enableRelationships = !!onOpenRelationships;
  const enableOpenSource = !!onOpenSource;

  if (!enableRelationships && !enableNavigate) {
    return null
  }

  return (
    <Box
      component={m.div}
      className={css.bottomButtonsContainer}
      variants={rootVariants}
      >
      {enableRelationships && (
        <ActionIconButton
          onClick={onOpenRelationships}
          variants={actionIconVariants('relationships')}
        >
          <Tooltip label="View relationships" fz="xs" color="dark">
            <IconTransform stroke={1.8} style={{ width: '72%' }} />
          </Tooltip>
        </ActionIconButton>
      )}
      {enableNavigate && (
        <ActionIconButton
          onClick={onNavigateTo}
          variants={actionIconVariants('navigate')}
        >
          <Tooltip label="Open scoped view" fz="xs" color="dark">
            <IconZoomScan stroke={1.8} style={{ width: '75%' }} />
          </Tooltip>
        </ActionIconButton>
      )}
      {enableOpenSource && (
        <ActionIconButton
          onClick={onOpenSource}
          variants={actionIconVariants('openSource')}
        >
          <Tooltip label="Go to source" fz="xs" color="dark">
            <IconFileSymlink stroke={1.8} style={{ width: '72%' }} />
          </Tooltip>
        </ActionIconButton>
      )}
    </Box>
  )
}
