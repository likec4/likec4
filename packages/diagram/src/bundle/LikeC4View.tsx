import type { Any, DiagramView, ViewId } from '@likec4/core/types'
import type * as aux from '@likec4/core/types/aux'
import { cx } from '@likec4/styles/css'
import { ActionIcon, Box } from '@mantine/core'
import { shallowEqual } from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'
import { memo, useState } from 'react'
import { isBoolean } from 'remeda'
import { FramerMotionConfig } from '../context/FramerMotionConfig'
import { LikeC4Diagram } from '../LikeC4Diagram'
import { useLikeC4Model } from '../likec4model/useLikeC4Model'
import { Overlay } from '../overlays/overlay/Overlay'
import type { LikeC4ViewProps } from './LikeC4View.props'
import { ShadowRoot } from './ShadowRoot'
import { cssInteractive, useColorScheme, useShadowRootStyle } from './styles.css'
import { ErrorMessage, ViewNotFound } from './ViewNotFound'

export function LikeC4View<A extends aux.Any = aux.UnknownLayouted>({
  viewId,
  ...props
}: LikeC4ViewProps<A>) {
  const likec4model = useLikeC4Model()
  const view = likec4model?.findView(viewId)

  if (!likec4model) {
    return (
      <ErrorMessage>
        LikeC4Model not found. Make sure you have LikeC4ModelProvider.
      </ErrorMessage>
    )
  }
  if (likec4model.stage !== 'layouted') {
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

type LikeC4ViewInnerProps<A extends aux.Any> = Omit<LikeC4ViewProps<A>, 'viewId'> & {
  view: DiagramView<A>
}
const LikeC4ViewInner = memo<LikeC4ViewInnerProps<aux.Any>>(({
  view,
  className,
  pannable = false,
  zoomable = false,
  keepAspectRatio = true,
  colorScheme: explicitColorScheme,
  injectFontCss = true,
  controls = false,
  fitView = true,
  fitViewPadding = '8px',
  background = 'transparent',
  browser = true,
  showDiagramTitle = false,
  showNavigationButtons = false,
  showNotations = false,
  enableFocusMode = false,
  enableDynamicViewWalkthrough = enableFocusMode,
  enableElementDetails = false,
  enableRelationshipBrowser = enableElementDetails,
  enableRelationshipDetails = enableRelationshipBrowser,
  reduceGraphics = 'auto',
  mantineTheme,
  styleNonce,
  style,
  reactFlowProps = {},
  renderNodes,
  ...props
}) => {
  const likec4model = useLikeC4Model('layouted')
  const colorScheme = useColorScheme(explicitColorScheme)

  const [shadowRootProps, cssstyle] = useShadowRootStyle(keepAspectRatio, view)

  const [browserViewId, onNavigateTo] = useState(null as aux.ViewId<Any> | null)

  const browserView = browserViewId ? likec4model.findView(browserViewId)?.$view : null

  const notations = view.notation?.nodes ?? []
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
        theme={mantineTheme}
        colorScheme={colorScheme}
        styleNonce={styleNonce}
        className={cx(
          'likec4-view',
          className,
        )}
        style={style}>
        <FramerMotionConfig>
          <LikeC4Diagram
            view={view}
            readonly
            pannable={pannable}
            zoomable={zoomable}
            background={background}
            fitView={fitView}
            fitViewPadding={fitViewPadding}
            showDiagramTitle={showDiagramTitle}
            showNotations={showNotations && hasNotations}
            enableDynamicViewWalkthrough={enableDynamicViewWalkthrough}
            showNavigationButtons={showNavigationButtons}
            experimentalEdgeEditing={false}
            enableFocusMode={enableFocusMode}
            enableRelationshipDetails={enableRelationshipDetails}
            enableElementDetails={enableElementDetails}
            enableRelationshipBrowser={enableRelationshipBrowser}
            enableElementTags={false}
            controls={controls}
            nodesDraggable={false}
            reduceGraphics={reduceGraphics}
            className={cx(isBrowserEnabled && cssInteractive)}
            // We may have multiple embedded views on the same page
            // so we don't want enable search and hotkeys
            enableSearch={false}
            {...isBrowserEnabled && {
              onNavigateTo: onNavigateTo,
              onCanvasClick: () => onNavigateTo(view.id),
              onNodeClick: () => onNavigateTo(view.id),
            }}
            reactFlowProps={reactFlowProps}
            renderNodes={renderNodes}
            {...props}
          />
          {browserView && (
            <Overlay onClose={() => onNavigateTo(null)}>
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
                enableElementTags
                controls
                readonly
                fitView
                fitViewPadding={'16px'}
                renderNodes={renderNodes}
                {...props}
                {...browserProps}
                showNotations={(browserProps.showNotations ?? true) &&
                  (browserView.notation?.nodes.length ?? 0) > 0}
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
        </FramerMotionConfig>
      </ShadowRoot>
    </>
  )
}, shallowEqual)
LikeC4ViewInner.displayName = 'LikeC4ViewInner'
