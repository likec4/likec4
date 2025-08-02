import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { hstack, vstack } from '@likec4/styles/patterns'
import { HoverCard, UnstyledButton } from '@mantine/core'
import { IconLink } from '@tabler/icons-react'
import { deepEqual } from 'fast-equals'
import * as m from 'motion/react-m'
import { useDiagramContext } from '../../hooks/useDiagram'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
import type { DiagramContext } from '../../state/types'

const selector = (state: DiagramContext) => state.view.links ?? []

export const LinksControl = () => {
  const links = useDiagramContext(selector, deepEqual)
  const portalProps = useMantinePortalProps()
  if (!links.length) {
    return null
  }

  return (
    <HoverCard
      position="bottom"
      initiallyOpened
      openDelay={100}
      closeDelay={300}
      offset={14}
      shadow="lg"
      {...portalProps}
    >
      <HoverCard.Target>
        <UnstyledButton
          component={m.button}
          layout="position"
          className={cx(
            'group',
            hstack({
              gap: '2',
              paddingInline: '2xs',
              paddingBlock: '2xs',
              rounded: 'sm',
              userSelect: 'none',
              cursor: 'pointer',
              color: {
                base: 'likec4.panel.action-icon.text',
                _hover: 'likec4.panel.action-icon.text.hover',
              },
              backgroundColor: {
                _hover: 'likec4.panel.action-icon.bg.hover',
              },
              display: {
                base: 'none',
                '@likec4-root/sm': 'flex',
              },
            }),
          )}>
          <IconLink size={14} stroke={2} />
          <Box
            css={{
              fontSize: '11px',
              fontWeight: 600,
              lineHeight: 1,
              opacity: 0.8,
            }}>
            {links.length}
          </Box>
        </UnstyledButton>
      </HoverCard.Target>
      <HoverCard.Dropdown
        className={cx(
          'nowheel nopan nodrag',
          vstack({
            layerStyle: 'likec4.dropdown',
            gap: 'sm',
            pointerEvents: 'all',
            maxWidth: '80cqw',
          }),
        )}>
        {links.map((link, i) => <Box key={`${i}-${link.url}`}>{link.url}</Box>)}
      </HoverCard.Dropdown>
    </HoverCard>
  )
}
