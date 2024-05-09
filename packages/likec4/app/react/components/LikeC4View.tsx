import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'

import { LikeC4Diagram } from '@likec4/diagram'
import { ModalBody, ModalCloseButton, ModalContent, ModalRoot } from '@mantine/core'
import { useColorScheme } from '@mantine/hooks'
import clsx from 'clsx'
import { type HTMLAttributes, useId } from 'react'
import { ShadowRoot } from './ShadowRoot'
import { cssInteractive, cssLikeC4Browser, cssLikeC4View } from './styles.css'

// to avoid dependency on @likec4/core
type ViewID = string
type DiagramView = {
  id: ViewID
  width: number
  height: number
}

type LikeC4ViewProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  view: DiagramView
  onNavigateTo?: (to: ViewID) => void
  colorScheme?: 'light' | 'dark' | undefined
}

export function LikeC4ViewComponent({
  onNavigateTo,
  view,
  colorScheme,
  ...props
}: LikeC4ViewProps) {
  const id = useId()
  const scheme = useColorScheme(colorScheme)

  return (
    <>
      <style type="text/css">
        {`
        [data-likec4-instance="${id}"] {
          box-sizing: border-box;
          padding: 0;
          width: 100%;
          height: auto;
          aspect-ratio: ${Math.ceil(view.width)} / ${Math.ceil(view.height)};
          max-height: ${Math.ceil(view.height)}px;
        }
      `}
      </style>
      <ShadowRoot
        colorScheme={scheme}
        data-likec4-instance={id}
        rootClassName={clsx(cssLikeC4View, !!onNavigateTo && cssInteractive)}
        {...props}
        {...(onNavigateTo && {
          onClick: (e) => {
            e.stopPropagation()
            onNavigateTo(view.id)
          }
        })}
      >
        <LikeC4Diagram
          view={view as any}
          readonly
          pannable={false}
          zoomable={false}
          background={'transparent'}
          fitView
          fitViewPadding={0.02}
          showElementLinks
          controls={false}
          nodesSelectable={false}
          keepAspectRatio={false}
          {...(onNavigateTo && {
            onNodeClick: ({ event }) => {
              event.stopPropagation()
              onNavigateTo(view.id)
            },
            onNavigateTo
          })}
        />
      </ShadowRoot>
      {
        /* {isOpened && (
        <LikeC4Browser
          colorScheme={scheme}
          initialViewId={browserInitialViewId.current}
          onClose={() => toggleBrowser(false)}
        />
      )} */
      }
    </>
  )
}

type LikeC4BrowserProps = {
  colorScheme?: 'light' | 'dark' | undefined
  view: DiagramView
  onNavigateTo: (to: ViewID) => void
  onClose: () => void
}

export function LikeC4BrowserModal({
  colorScheme,
  view,
  onNavigateTo,
  onClose
}: LikeC4BrowserProps) {
  const id = useId()
  const scheme = useColorScheme(colorScheme)
  return (
    <>
      <style type="text/css">
        {`
        [data-likec4-instance="${id}"] {
          position: fixed;
          inset: 0;
          z-index: 9999;
          width: 100%;
          height: 100%;
        }
      `}
      </style>
      <ShadowRoot
        colorScheme={scheme}
        rootClassName={cssLikeC4Browser}
        data-likec4-instance={id}>
        <ModalRoot
          keepMounted
          opened
          fullScreen
          withinPortal={false}
          onClose={onClose}>
          <ModalContent>
            <ModalCloseButton />
            <ModalBody w={'100%'} h={'100%'} p={0}>
              <LikeC4Diagram
                view={view as any}
                readonly
                pannable
                zoomable
                fitView
                fitViewPadding={0.05}
                controls={false}
                nodesSelectable={false}
                nodesDraggable={false}
                keepAspectRatio={false}
                onNavigateTo={onNavigateTo}
              />
            </ModalBody>
          </ModalContent>
        </ModalRoot>
      </ShadowRoot>
    </>
  )
}
