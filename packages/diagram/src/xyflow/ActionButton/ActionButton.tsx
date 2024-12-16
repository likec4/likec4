import { ActionIcon, Tooltip } from "@mantine/core"
import { stopPropagation } from "../utils"
import * as css from "./ActionButton.css"
import clsx from "clsx"
import { m, type Variants } from "framer-motion"

export type ActionButtonProps = {
  key: string
  onClick: ((e: React.MouseEvent) => void)
  IconComponent: React.ComponentType<any>
  tooltipLabel?: string
}

const variants = {
  idle: {
    '--icon-scale': 'scale(1)',
    '--ai-bg': 'var(--ai-bg-idle)',
  },
  hovered: {
    '--icon-scale': 'scale(1)',
    '--ai-bg': 'var(--ai-bg-hover)',
  },
  selected: {}
} satisfies Variants
variants['selected'] = variants['hovered']

export const ActionButton = ({
  key,
  onClick: action,
  IconComponent,
  tooltipLabel,
  ...props
}: ActionButtonProps) => {

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
      variants={variants}
      className={clsx('nodrag nopan', css.btn)}
      radius="md"
      role="button"
      onClick={action}
      onDoubleClick={stopPropagation}
      {...props}
      >
      <IconComponent
        style={{
          width: '70%',
          transform: 'var(--icon-scale)'
        }} />
      </ActionIcon>
  </Tooltip>
  )
}
