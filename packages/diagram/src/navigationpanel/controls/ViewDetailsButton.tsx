import { cx } from '@likec4/styles/css'
import { Box, HStack } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import {
  UnstyledButton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconId,
  IconLink,
} from '@tabler/icons-react'
import * as m from 'motion/react-m'
import { useRef } from 'react'
import { clamp } from 'remeda'
import { FloatingWindow } from '../../components/FloatingWindow'
import { useRootContainer } from '../../context'
import { selectDiagramContext, useDiagramSelector } from '../../hooks/useDiagram'
import { ViewDetailsWindow } from '../windows/ViewDetailsWindow'

const selector = selectDiagramContext(({ view }) => {
  return {
    id: view.id,
    links: view.links?.length ?? 0,
  }
})

type ViewDetailsButtonProps = {
  onOpen: () => void
}

export function ViewDetailsButton({ onOpen }: ViewDetailsButtonProps) {
  const { ref: rootRef } = useRootContainer()
  const [opened, handlers] = useDisclosure(false)
  const data = useDiagramSelector(selector)

  const initialsRef = useRef({
    dimensions: {
      initialWidth: 200,
      initialHeight: 200,
    },
    initialPosition: {
      top: 65,
      left: 32,
    },
  })

  const toggle = () => {
    if (opened) {
      handlers.close()
    } else {
      const rootElement = rootRef.current
      if (rootElement) {
        const viewport = rootElement.getBoundingClientRect()
        const panelRect = rootElement.querySelector('[data-panel="navigation"]')?.getBoundingClientRect()

        let height = viewport.height - 80
        // Bottom-left aligned to navigation panel
        if (panelRect) {
          initialsRef.current.initialPosition.top = panelRect.bottom + 10
          initialsRef.current.initialPosition.left = panelRect.left + 55 // to avoid overlapping with editor panel
          height = viewport.height - (panelRect.top - viewport.top + panelRect.height) - 32
        }

        initialsRef.current.dimensions.initialHeight = Math.max(100, height)
        initialsRef.current.dimensions.initialWidth = clamp(viewport.width * 0.3, { min: 200, max: 500 })
      }
      handlers.open()
      onOpen()
    }
  }

  return (
    <>
      <ViewDetailsCardTrigger linksCount={data.links} onClick={toggle} opened={opened} />
      {opened && (
        <FloatingWindow windowId={'view-details'} {...initialsRef.current} onClose={handlers.close}>
          <ViewDetailsWindow />
        </FloatingWindow>
      )}
    </>
  )
}

const ViewDetailsCardTrigger = (
  { linksCount, onClick, opened }: { linksCount: number; onClick: () => void; opened: boolean },
) => (
  <UnstyledButton
    component={m.button}
    layout="position"
    aria-selected={opened}
    whileTap={{
      scale: 0.95,
      translateY: 1,
    }}
    onClick={e => {
      e.stopPropagation()
      onClick()
    }}
    className={cx(
      'group',
      hstack({
        gap: '2',
        layerStyle: 'likec4.panel.action',
        display: {
          base: 'none',
          '@/xs': 'flex',
        },
        _selected: {
          backgroundColor: {
            base: 'primary.body',
            _hover: 'primary.body.hover',
          },
          color: {
            base: 'primary.text',
            _hover: 'primary.text',
          },
        },
      }),
      ``,
    )}>
    <IconId size={16} stroke={1.8} />
    {linksCount > 0 && (
      <HStack gap="0.5">
        <IconLink size={14} stroke={2} />
        <Box
          css={{
            fontSize: 'xxs',
            fontWeight: 'bold',
            lineHeight: '1',
            opacity: '0.7',
          }}>
          {linksCount}
        </Box>
      </HStack>
    )}
  </UnstyledButton>
)
