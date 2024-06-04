import '@mantine/core/styles.css'

import { LikeC4Diagram, useUpdateEffect } from '@likec4/diagram'
import { ActionIcon, Group, ModalBody, ModalCloseButton, ModalContent, ModalOverlay, ModalRoot } from '@mantine/core'
import { useStateHistory } from '@mantine/hooks'
import { useMountEffect } from '@react-hookz/web'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useId, useState } from 'react'
import { cssDiagram, historyButtons, modalBody, modalCloseButton, modalContent } from './LikeC4Browser.css'
import { ShadowRoot } from './ShadowRoot'
import { useColorScheme } from './styles'
import { cssLikeC4Browser } from './styles.css'
import type { DiagramView, LikeC4ViewBaseProps } from './types'

export type LikeC4BrowserProps<ViewId extends string> = Omit<LikeC4ViewBaseProps<ViewId>, 'viewId' | 'interactive'> & {
  view: DiagramView<ViewId>
  onNavigateTo: (to: ViewId) => void
  onClose: () => void
}

export function LikeC4Browser<ViewId extends string>({
  colorScheme,
  view,
  injectFontCss,
  onNavigateTo,
  onClose,
  overlay,
  background = 'dots',
  ...props
}: LikeC4BrowserProps<ViewId>) {
  const id = useId()
  const scheme = useColorScheme(colorScheme)
  const [opened, setOpened] = useState(false)

  const defaultOverlayOpacity = scheme === 'light' ? 0.7 : 0.6

  const [historyViewId, historyOps, {
    history,
    current: historyIndex
  }] = useStateHistory(view.id)

  const hasBack = historyIndex > 0
  const hasForward = historyIndex < history.length - 1

  useUpdateEffect(() => {
    if (view.id !== historyViewId) {
      historyOps.set(view.id)
    }
  }, [view.id])

  useUpdateEffect(() => {
    if (view.id !== historyViewId) {
      onNavigateTo(historyViewId)
    }
  }, [historyViewId])

  useMountEffect(() => {
    setOpened(true)
  })
  const closeMe = () => {
    setOpened(false)
    setTimeout(() => {
      onClose()
    }, 200)
  }

  return (
    <>
      <style
        type="text/css"
        dangerouslySetInnerHTML={{
          __html: `
        [data-likec4-instance="${id}"] {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 0;
          margin: 0;
          border: 0 solid transparent;
          box-sizing: border-box;
          z-index: 9999;
          width: 100dvw;
          height: 100dvh;
        }
      `
        }} />
      <ShadowRoot
        colorScheme={scheme}
        injectFontCss={injectFontCss}
        rootClassName={cssLikeC4Browser}
        data-likec4-instance={id}
        {...props}>
        <ModalRoot
          opened={opened}
          fullScreen
          withinPortal={false}
          onClose={closeMe}>
          <ModalOverlay
            blur={overlay?.blur ?? 8}
            color="var(--mantine-color-body)"
            fixed={false}
            backgroundOpacity={overlay?.opacity ?? defaultOverlayOpacity}
          />
          <ModalContent className={modalContent}>
            <ModalCloseButton className={modalCloseButton} />
            <ModalBody className={modalBody}>
              <LikeC4Diagram
                className={cssDiagram}
                view={view as any}
                readonly
                pannable
                zoomable
                fitView
                showDiagramTitle
                showElementLinks
                enableDynamicViewWalkthrough
                background={background}
                fitViewPadding={0.05}
                controls={false}
                nodesSelectable={false}
                nodesDraggable={false}
                keepAspectRatio={false}
                onNavigateTo={to => onNavigateTo(to as string as ViewId)}
              />
              <Group className={historyButtons} gap={'xs'}>
                {hasBack && (
                  <ActionIcon variant="light" color="gray" size={'lg'} onClick={() => historyOps.back()}>
                    <IconChevronLeft />
                  </ActionIcon>
                )}
                {hasForward && (
                  <ActionIcon
                    variant="light"
                    color="gray"
                    size={'lg'}
                    onClick={() => historyOps.forward()}>
                    <IconChevronRight />
                  </ActionIcon>
                )}
              </Group>
            </ModalBody>
          </ModalContent>
        </ModalRoot>
      </ShadowRoot>
    </>
  )
}
