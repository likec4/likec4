import { type DiagramView, invariant } from '@likec4/core'
import { Box, CloseButton, ModalBody, ModalContent, ModalOverlay, ModalRoot, Title } from '@mantine/core'
import { useToggle } from '@react-hookz/web'
import { shallowEqual } from 'fast-equals'
import { memo, useState } from 'react'
import {
  modalBody,
  modalCloseButton,
  modalCloseButtonBox,
  modalContent,
  modalHeader
} from './EmbeddedLikeC4Diagram.css'
import { useUpdateEffect } from './hooks'
import { LikeC4Diagram } from './LikeC4Diagram'
import { type LikeC4ColorScheme } from './LikeC4Diagram.props'
import { EnsureMantine } from './mantine/EnsureMantine'
import { StaticLikeC4Diagram } from './StaticLikeC4Diagram'
import { KeepAspectRatio } from './ui/KeepAspectRatio'

export type EmbeddedLikeC4DiagramProps = {
  viewId: string
  views: Record<string, DiagramView>
  /**
   * Controls color scheme used for styling the flow
   * By default inherits from system or surrounding MantineProvider
   *
   * @example 'light' | 'dark'
   */
  colorScheme?: LikeC4ColorScheme | undefined
}

function EmbeddedLikeC4DiagramCmp({
  viewId,
  views,
  colorScheme
}: EmbeddedLikeC4DiagramProps) {
  const [isOpened, toggleOpened] = useToggle(false)
  const [browserViewId, setBrowserViewId] = useState(viewId)

  const view = views[viewId]
  invariant(view, `View with id ${viewId} not found`)
  const browserView = views[browserViewId]
  invariant(browserView, `View with id ${browserViewId} not found`)

  const closeBrowser = () => {
    toggleOpened(false)
    setBrowserViewId(viewId)
  }

  useUpdateEffect(closeBrowser, [viewId])
  return (
    <EnsureMantine colorScheme={colorScheme}>
      <KeepAspectRatio
        enabled
        height={view.height}
        width={view.width}
        onClick={e => {
          e.stopPropagation()
          toggleOpened(true)
        }}
      >
        <StaticLikeC4Diagram
          colorScheme={colorScheme}
          view={view}
          fitView
          fitViewPadding={0.01}
          background={'transparent'}
          keepAspectRatio={false}
        />
      </KeepAspectRatio>
      <ModalRoot opened={isOpened} onClose={closeBrowser} fullScreen>
        <ModalOverlay blur={16} />
        <ModalContent className={modalContent}>
          <ModalBody className={modalBody}>
            <Box className={modalHeader}>
              <Title order={4}>{browserView.title || browserView.id}</Title>
            </Box>
            {isOpened && (
              <LikeC4Diagram
                readonly
                view={browserView}
                colorScheme={colorScheme}
                background={'transparent'}
                fitViewPadding={0.09}
                onCanvasDblClick={closeBrowser}
                onNavigateTo={({ event, element }) => {
                  event.stopPropagation()
                  setBrowserViewId(element.navigateTo)
                }}
              />
            )}
            <Box className={modalCloseButtonBox}>
              <CloseButton className={modalCloseButton} onClick={closeBrowser} />
            </Box>
          </ModalBody>
        </ModalContent>
      </ModalRoot>
    </EnsureMantine>
  )
}

export const EmbeddedLikeC4Diagram = memo(EmbeddedLikeC4DiagramCmp, shallowEqual) as typeof EmbeddedLikeC4DiagramCmp
