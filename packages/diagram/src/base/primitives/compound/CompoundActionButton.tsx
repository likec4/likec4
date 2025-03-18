import { css, cx } from '@likec4/styles/css'
import { actionBtn } from '@likec4/styles/recipes'
import { ActionIcon, Box } from '@mantine/core'
import { IconZoomScan } from '@tabler/icons-react'
import { m } from 'framer-motion'
import { hiddenIfZoomTooSmall } from '../../../LikeC4Diagram.css'
import { stopPropagation } from '../../../utils/xyflow'
import type { NodeProps } from '../../types'

type CompoundActionButtonProps = NodeProps & {
  icon?: React.ReactNode
  onClick: (e: React.MouseEvent) => void
}

export function CompoundActionButton({
  data: {
    hovered: isHovered = false,
  },
  icon,
  onClick,
}: CompoundActionButtonProps) {
  return (
    <Box
      className={cx(
        css({
          position: 'absolute',
          top: '5px',
          left: '2px',
          // Panda did not merge this conditions
          [`:where([data-mantine-color-scheme='light'] [data-compound-transparent="true"][data-likec4-hovered="true"]) &`]:
            {
              ['--_color']: '{colors.likec4.element.loContrast}',
            },
        }),
        hiddenIfZoomTooSmall,
        'compound-action',
      )}>
      <m.div
        initial={false}
        animate={{
          scale: isHovered ? 1.2 : 1,
          x: isHovered ? -1 : 0,
          opacity: isHovered ? 1 : 0.8,
          // y: isHovered ? -1 : 0,
        }}
        whileHover={{
          scale: 1.35,
          x: -1,
          // y: 1,
        }}
        whileTap={{ scale: 1 }}
      >
        <ActionIcon
          className={cx(
            'nodrag nopan',
            actionBtn(),
            css({
              color: '[var(--_compound-title-color)]',
              _whenHovered: {
                transitionDelay: '150ms',
              },
              _light: {
                _compoundTransparent: {
                  opacity: 0.85,
                  '--_node-hovered': `color-mix(in srgb , {colors.likec4.element.fill},  transparent 70%)`,
                  '--_btn-hovered': `color-mix(in srgb , {colors.likec4.element.fill},  transparent 10%)`,
                },
                _whenHovered: {
                  opacity: 1,
                },
              },
            }),
          )}
          // Otherwise node receives click event and is selected
          onClick={onClick}
          onDoubleClick={stopPropagation}
        >
          {icon ?? <IconZoomScan stroke={2} />}
        </ActionIcon>
      </m.div>
    </Box>
  )
}
