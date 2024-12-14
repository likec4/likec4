import { ActionIcon, Tooltip } from "@mantine/core"
import { stopPropagation } from "../utils"
import * as css from "./ActionButton.css"
import clsx from "clsx"
import { m, type Variants } from "framer-motion"

const TRANSLATE_DIFF_X = 8;
const TRANSLATE_DIFF_Y = 4;

export type ActionButtonProps = {
  key: string
  onClick: ((e: React.MouseEvent) => void),
  IconComponent: React.ComponentType<any>,
  translate: { x: number, y: number },
  tooltipLabel?: string
}

const variants = (translate: { x: number, y: number }) => {
  const variants = {
    idle: {
      '--icon-scale': 'scale(1)',
      '--ai-bg': 'var(--ai-bg-idle)',
      scale: 1,
      opacity: 0.5,
      translateX: 0,
      translateY: 0
    },
    hovered: {
      '--icon-scale': 'scale(1)',
      '--ai-bg': 'var(--ai-bg-hover)',
      scale: 1.32,
      opacity: 1,
      translateX: translate.x*TRANSLATE_DIFF_X,
      translateY: translate.y*TRANSLATE_DIFF_Y
    },
    selected: {}
  } satisfies Variants
  variants['selected'] = variants['hovered']
  return variants
}

export const ActionButton = ({
  key,
  onClick: action,
  IconComponent,
  translate,
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
      {...props}
      key={key}
      component={m.div}
      variants={variants(translate)}
      className={clsx('nodrag nopan', css.btn)}
      radius="md"
      role="button"
      onClick={action}
      onDoubleClick={stopPropagation}
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
