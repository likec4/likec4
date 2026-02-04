import { css } from '@likec4/styles/css'
import { Box, VStack } from '@likec4/styles/jsx'
import { Grid, GridCol, Group, ScrollArea, Title } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { useTimeoutEffect } from '@react-hookz/web'
import { useSelector } from '@xstate/react'
import { AnimatePresence, LayoutGroup, usePresence } from 'motion/react'
import { memo, Suspense, useEffect, useMemo, useRef } from 'react'
import { isTruthy } from 'remeda'
import { createEmptyActor } from 'xstate'
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

const selectIsOpened = (s: SearchActorSnapshot) => {
  try {
    return s.status === 'active' && (s.value === 'opened' || s.value === 'pickView')
  } catch (e) {
    console.error(e)
    return false
  }
}

export const Search = memo(() => {
  const searchActorRef = useSearchActorRef()
  const emptyActorRef = useRef(createEmptyActor() as SearchActorRef)
  const isOpened = useSelector(searchActorRef ?? emptyActorRef.current, selectIsOpened)

  const close = useCallbackRef(() => {
    searchActorRef?.send({ type: 'close' })
  })

  useHotkeys(
    useMemo(() => {
      const openSearch = () => searchActorRef?.send({ type: 'open' })
      return searchActorRef ?
        [
          ['mod+k', openSearch, {
            preventDefault: true,
          }],
          ['mod+f', openSearch, {
            preventDefault: true,
          }],
        ] :
        []
    }, [searchActorRef]),
  )

  return (
    <AnimatePresence>
      {searchActorRef && isOpened && (
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
          <SearchOverlayBody searchActorRef={searchActorRef} />
        </Overlay>
      )}
    </AnimatePresence>
  )
})
Search.displayName = 'Search'

const selectPickViewFor = (s: SearchActorSnapshot) => s.context.pickViewFor

const SearchOverlayBody = memo<{ searchActorRef: SearchActorRef }>(({ searchActorRef }) => {
  const ref = useRef<HTMLDivElement>(null)
  const pickViewFor = useSelector(searchActorRef, selectPickViewFor)

  useTimeoutEffect(() => {
    if (isTruthy(searchActorRef.getSnapshot().context.openedWithSearch)) {
      focusToFirstFoundElement(ref.current)
    }
  }, 150)

  const [isPresent, safeToRemove] = usePresence()

  useEffect(() => {
    if (isPresent) {
      return
    }
    safeToRemove()
    try {
      // Actor might be stopped, so we need to catch the error
      searchActorRef.send({ type: 'animation.presence.end' })
    } catch (e) {
      console.debug('SearchOverlayBody: animation.presence.end failed', e)
    }
  }, [isPresent, searchActorRef, safeToRemove])

  return (
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
            <LayoutGroup id="likec4-search-elements">
              <Suspense>
                <ElementsColumn />
              </Suspense>
            </LayoutGroup>
          </ScrollArea>
        </GridCol>
        <GridCol span={6}>
          <ScrollArea
            type="scroll"
            className={scrollArea}
            pr="xs"
            scrollbars="y">
            <Suspense>
              <LayoutGroup id="likec4-search-views">
                <ViewsColumn />
              </LayoutGroup>
            </Suspense>
          </ScrollArea>
        </GridCol>
      </Grid>
      {pickViewFor && <PickView searchActorRef={searchActorRef} elementFqn={pickViewFor} />}
    </Box>
  )
})
