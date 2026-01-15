import { css } from '@likec4/styles/css'
import { Box, VStack } from '@likec4/styles/jsx'
import { Grid, GridCol, Group, ScrollArea, Title } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { useTimeoutEffect } from '@react-hookz/web'
import { useSelector } from '@xstate/react'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import { memo, useRef } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { isTruthy } from 'remeda'
import { ErrorFallback } from '../components/ErrorFallback'
import { DiagramFeatures } from '../context/DiagramFeatures'
import { useCallbackRef } from '../hooks/useCallbackRef'
import { useSearchActorRef } from '../hooks/useSearchActor'
import { Overlay } from '../overlays/overlay/Overlay'
import { ElementsColumn } from './components/ElementsColumn'
import { PickView } from './components/PickView'
import { SearchByTags } from './components/SearchByTags'
import { LikeC4SearchInput } from './components/SearchInput'
import { focusToFirstFoundElement, moveFocusToSearchInput } from './components/utils'
import { ViewsColumn } from './components/ViewsColum'
import type { SearchActorRef, SearchActorSnapshot } from './searchActor'

const dialog = css({
  backgroundColor: `[rgb(34 34 34 / var(--_opacity, 95%))]`,
  _light: {
    backgroundColor: `[rgb(250 250 250 / var(--_opacity, 95%))]`,
  },
  backdropFilter: 'auto',
  backdropBlur: 'var(--_blur, 10px)',
  //   base: `[rgb(34 34 34 / var(${backdropOpacity}))]`,
  //   _light: `[rgb(255 255 255/ var(${backdropOpacity}))]`,
  // },
})

const body = css({
  // containerName: 'likec4-search',
  // containerType: 'size',
  // position: 'fixed',
  // zIndex: 901,
  // top: '0',
  // left: '0',
  width: '100%',
  height: '100%',
  maxHeight: '100vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'stretch',
  gap: 'sm',
  paddingTop: '[20px]',
  paddingLeft: 'md',
  paddingRight: 'md',
  paddingBottom: 'sm',
  background: 'transparent',
  // backgroundColor: {
  //   _dark: `[rgb(34 34 34 / 0.95)]`,
  //   _light: `[rgb(255 255 255/ 0.95)]`,
  // },
})

const scrollArea = css({
  height: [
    '100%',
    '100cqh',
  ],
  '& .mantine-ScrollArea-viewport': {
    minHeight: '100%',
    '& > div': {
      minHeight: '100%',
      height: '100%',
    },
  },
})

const selectIsOpened = (s: SearchActorSnapshot) => !s.matches('inactive')

export function Search() {
  const searchActorRef = useSearchActorRef()

  return (
    <DiagramFeatures.Overlays>
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={close}>
        <AnimatePresence>
          {searchActorRef && <SearchOverlayCtx searchActorRef={searchActorRef} />}
        </AnimatePresence>
      </ErrorBoundary>
    </DiagramFeatures.Overlays>
  )
}

const selectPickViewFor = (s: SearchActorSnapshot) => s.context.pickViewFor ?? null

const SearchOverlayCtx = memo<{ searchActorRef: SearchActorRef }>(({ searchActorRef }) => {
  const isOpened = useSelector(searchActorRef, selectIsOpened)
  const ref = useRef<HTMLDivElement>(null)
  const pickViewFor = useSelector(searchActorRef, selectPickViewFor)

  useTimeoutEffect(() => {
    if (isTruthy(searchActorRef.getSnapshot().context.openedWithSearch)) {
      focusToFirstFoundElement(ref.current)
    }
  }, isOpened ? 150 : undefined)

  const openSearch = () => {
    searchActorRef.send({ type: 'open' })
  }

  const close = useCallbackRef(() => {
    searchActorRef.send({ type: 'close' })
  })

  useHotkeys([
    ['mod+k', openSearch, {
      preventDefault: true,
    }],
    ['mod+f', openSearch, {
      preventDefault: true,
    }],
  ])

  return (
    <AnimatePresence propagate>
      {isOpened && (
        <Overlay
          fullscreen
          withBackdrop={false}
          backdrop={{
            opacity: 0.9,
          }}
          classes={{
            dialog,
            body,
          }}
          openDelay={0}
          onClose={close}
          data-likec4-search="true"
        >
          <Box ref={ref} display={'contents'}>
            <Group
              className={'group'}
              wrap="nowrap"
              onClick={e => {
                e.stopPropagation()
                moveFocusToSearchInput(ref.current)
              }}>
              <VStack flex={1} px={'sm'}>
                <LikeC4SearchInput />
                <SearchByTags />
              </VStack>
            </Group>
            <Grid>
              <GridCol span={6}>
                <Title component={'div'} order={6} c="dimmed" pl="sm">Elements</Title>
              </GridCol>
              <GridCol span={6}>
                <Title component={'div'} order={6} c="dimmed" pl="sm">Views</Title>
              </GridCol>
            </Grid>
            <Grid
              className={css({
                containerName: 'likec4-search-elements',
                containerType: 'size',
                overflow: 'hidden',
                flexGrow: 1,
              })}>
              <GridCol span={6}>
                <ScrollArea
                  type="scroll"
                  className={scrollArea}
                  pr="xs"
                  scrollbars="y">
                  <AnimatePresence>
                    <LayoutGroup id="likec4-search-elements">
                      <ElementsColumn />
                    </LayoutGroup>
                  </AnimatePresence>
                </ScrollArea>
              </GridCol>
              <GridCol span={6}>
                <ScrollArea
                  type="scroll"
                  className={scrollArea}
                  pr="xs"
                  scrollbars="y">
                  <AnimatePresence>
                    <LayoutGroup id="likec4-search-views">
                      <ViewsColumn />
                    </LayoutGroup>
                  </AnimatePresence>
                </ScrollArea>
              </GridCol>
            </Grid>
            {pickViewFor && <PickView searchActorRef={searchActorRef} elementFqn={pickViewFor} />}
          </Box>
        </Overlay>
      )}
    </AnimatePresence>
  )
})
