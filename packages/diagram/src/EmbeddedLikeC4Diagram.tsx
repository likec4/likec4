import { type DiagramView, invariant } from '@likec4/core'
import { Box, CloseButton, Modal, Title } from '@mantine/core'
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
import { type LikeC4ColorMode } from './LikeC4Diagram.props'
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
  colorMode?: LikeC4ColorMode | undefined
}

function EmbeddedLikeC4DiagramCmp({
  viewId,
  views,
  colorMode
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
    <EnsureMantine colorMode={colorMode}>
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
          colorMode={colorMode}
          view={view}
          fitView
          fitViewPadding={0.01}
          background={'transparent'}
          keepAspectRatio={false}
        />
      </KeepAspectRatio>
      <Modal.Root opened={isOpened} onClose={closeBrowser} fullScreen>
        <Modal.Overlay blur={16} />
        <Modal.Content className={modalContent}>
          <Modal.Body className={modalBody}>
            <Box className={modalHeader}>
              <Title order={4}>{browserView.title || browserView.id}</Title>
            </Box>
            {isOpened && (
              <LikeC4Diagram
                readonly
                view={browserView}
                colorMode={colorMode}
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
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </EnsureMantine>
  )
}

export const EmbeddedLikeC4Diagram = memo(EmbeddedLikeC4DiagramCmp, shallowEqual) as typeof EmbeddedLikeC4DiagramCmp
