import { type ActionIconProps, ActionIcon, Tooltip } from '@mantine/core'
import clsx from 'clsx'
import { type HTMLMotionProps, type Variants, m } from 'framer-motion'
import type { PropsWithoutRef } from 'react'
import { stopPropagation } from '../../xyflow/utils'
import { useActionButtonBarCtx } from '../action-button-bar/useActionButtonBarCtx'
import * as css from './ActionButton.css'

export type ActionButtonProps = PropsWithoutRef<
  Omit<ActionIconProps & HTMLMotionProps<'div'>, 'onClick' | 'children'> & {
    onClick: (e: React.MouseEvent) => void
    IconComponent: React.ComponentType<any>
    tooltipLabel?: string
  }
>

const variants = {
  idle: {
    '--icon-scale': 'scale(1)',
    '--ai-bg': 'var(--ai-bg-idle)',
  },
  hovered: {
    '--icon-scale': 'scale(1)',
    '--ai-bg': 'var(--ai-bg-hover)',
  },
  selected: {},
} satisfies Variants
variants['selected'] = variants['hovered']

export const ActionButton = ({
  onClick: action,
  IconComponent,
  tooltipLabel,
  ...props
}: ActionButtonProps) => {
  const ctx = useActionButtonBarCtx() ?? {
    variants: variants,
  }
  return (
    <Tooltip
      fz="xs"
      color="dark"
      label={tooltipLabel ?? ''}
      disabled={!tooltipLabel}
      withinPortal={false}
      offset={2}
      openDelay={600}>
      <ActionIcon
        component={m.div}
        className={clsx('nodrag nopan', css.btn)}
        radius="md"
        role="button"
        onClick={action}
        onDoubleClick={stopPropagation}
        {...ctx}
        {...props}
      >
        <IconComponent
          style={{
            width: '70%',
            transform: 'var(--icon-scale)',
          }} />
      </ActionIcon>
    </Tooltip>
  )
}
