import { FramerMotionConfig, LikeC4Diagram, Overlay, useLikeC4Model } from '@likec4/diagram'
import clsx from 'clsx'
import { memo, useState } from 'react'
import { ShadowRoot } from './ShadowRoot'

import type { DiagramView, ViewId } from '@likec4/core'
import { ActionIcon, Box } from '@mantine/core'
import { shallowEqual } from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'
import { AnimatePresence } from 'framer-motion'
import { isBoolean } from 'remeda'
import type { LikeC4ViewProps } from './LikeC4View.props'
import { ShadowRootMantineProvider } from './ShadowRootMantineProvider'
import { useColorScheme, useShadowRootStyle } from './style'
import * as css from './styles.css'
import { ErrorMessage, ViewNotFound } from './ViewNotFound'

export function LikeC4View<
  ViewId extends string = string,
  Tag = string,
  Kind = string,
>({
  viewId,
  ...props
}: LikeC4ViewProps<ViewId, Tag, Kind>) {
  const likec4model = useLikeC4Model()
  const view = likec4model?.findView(viewId)

  if (!likec4model) {
    return (
      <ErrorMessage>
        LikeC4Model not found. Make sure you have LikeC4ModelProvider.
      </ErrorMessage>
    )
  }
  if (likec4model.type !== 'layouted') {
    return (
      <ErrorMessage>
        LikeC4Model is not layouted. Make sure you have LikeC4ModelProvider with layouted model.
      </ErrorMessage>
    )
  }

  if (!view || !view.isDiagram()) {
    return <ViewNotFound viewId={viewId} />
  }

  return <LikeC4ViewInner view={view.$view} {...props} />
}

type LikeC4ViewInnerProps = Omit<LikeC4ViewProps<any, any, any>, 'viewId'> & {
  view: DiagramView
}
const LikeC4ViewInner = memo<LikeC4ViewInnerProps>(({
  view,
  className,
  pannable = false,
  zoomable = false,
  keepAspectRatio = true,
  colorScheme: explicitColorScheme,
  injectFontCss = true,
  controls = false,
  fitView = true,
  fitViewPadding = 0.05,
  background = 'transparent',
  browser = true,
  showDiagramTitle = false,
  showNavigationButtons = false,
  showNotations = false,
  enableFocusMode = false,
  enableElementDetails = false,
  enableRelationshipBrowser = enableElementDetails,
  enableRelationshipDetails = enableRelationshipBrowser,
  mantineTheme,
  styleNonce,
  style,
  ...props
}) => {
  const likec4model = useLikeC4Model(true, 'layouted')
  const colorScheme = useColorScheme(explicitColorScheme)

  const [shadowRootProps, cssstyle] = useShadowRootStyle(keepAspectRatio, view)

  const [browserViewId, onNavigateTo] = useState(null as ViewId | null)

  const browserView = browserViewId ? likec4model.findView(browserViewId)?.$view : null

  const notations = view.notation?.elements ?? []
  const hasNotations = notations.length > 0

  let nonce
  if (typeof styleNonce === 'string') {
    nonce = styleNonce
  } else if (typeof styleNonce === 'function') {
    nonce = styleNonce()
  }

  const isBrowserEnabled = browser !== false

  const browserProps = isBoolean(browser) ? {} : browser

  return (
    <>
      <style
        type="text/css"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: cssstyle,
        }} />
      <ShadowRoot
        {...shadowRootProps}
        injectFontCss={injectFontCss}
        className={clsx('likec4-view', className)}
        style={style}>
        <ShadowRootMantineProvider
          theme={mantineTheme}
          colorScheme={colorScheme}
          styleNonce={styleNonce}
          className={clsx(css.cssLikeC4View, isBrowserEnabled && css.cssInteractive)}
        >
          <FramerMotionConfig>
            <LikeC4Diagram
              view={view as any}
              readonly
              pannable={pannable}
              zoomable={zoomable}
              background={background}
              fitView={fitView}
              fitViewPadding={fitViewPadding}
              showDiagramTitle={showDiagramTitle}
              showNotations={showNotations && hasNotations}
              enableDynamicViewWalkthrough={enableFocusMode}
              showNavigationButtons={showNavigationButtons}
              experimentalEdgeEditing={false}
              enableFocusMode={enableFocusMode}
              enableRelationshipDetails={enableRelationshipDetails}
              enableElementDetails={enableElementDetails}
              enableRelationshipBrowser={enableRelationshipBrowser}
              controls={controls}
              nodesSelectable
              nodesDraggable={false}
              // We may have multiple embedded views on the same page
              // so we don't want enable search and hotkeys
              enableSearch={false}
              {...isBrowserEnabled && {
                onNavigateTo: onNavigateTo,
                onCanvasClick: () => onNavigateTo(view.id),
                onNodeClick: () => onNavigateTo(view.id),
              }}
              {...props}
            />
            <AnimatePresence>
              {browserView && (
                <Overlay className={css.browserOverlay} onClose={() => onNavigateTo(null)}>
                  <LikeC4Diagram
                    view={browserView}
                    background="dots"
                    onNavigateTo={to => onNavigateTo(to as ViewId)}
                    enableDynamicViewWalkthrough
                    enableFocusMode
                    enableRelationshipBrowser
                    enableElementDetails
                    enableRelationshipDetails
                    enableSearch
                    controls
                    readonly
                    fitView
                    fitViewPadding={0.1}
                    {...props}
                    {...browserProps}
                    showNotations={(browserProps.showNotations ?? true) &&
                      (browserView.notation?.elements.length ?? 0) > 0}
                  />
                  <Box pos="absolute" top={'1rem'} right={'1rem'}>
                    <ActionIcon
                      variant="default"
                      color="gray"
                      onClick={(e) => {
                        e.stopPropagation()
                        onNavigateTo(null)
                      }}>
                      <IconX />
                    </ActionIcon>
                  </Box>
                </Overlay>
              )}
            </AnimatePresence>
          </FramerMotionConfig>
        </ShadowRootMantineProvider>
      </ShadowRoot>
    </>
  )
}, shallowEqual)
LikeC4ViewInner.displayName = 'LikeC4ViewInner'
