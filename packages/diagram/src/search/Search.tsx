import { css } from '@likec4/styles/css'
import { Box, VStack } from '@likec4/styles/jsx'
import { Grid, GridCol, Group, ScrollArea, Title } from '@mantine/core'
import {
  useCallbackRef,
  useHotkeys,
} from '@mantine/hooks'
import { useTimeoutEffect } from '@react-hookz/web'
import { useSelector } from '@xstate/react'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import { useRef } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { isTruthy } from 'remeda'
import { ErrorFallback } from '../components/ErrorFallback'
import { DiagramFeatures } from '../context/DiagramFeatures'
import { Overlay } from '../overlays/overlay/Overlay'
import { ElementsColumn } from './components/ElementsColumn'
import { PickView } from './components/PickView'
import { SearchByTags } from './components/SearchByTags'
import { LikeC4SearchInput } from './components/SearchInput'
import { focusToFirstFoundElement, moveFocusToSearchInput } from './components/utils'
import { ViewsColumn } from './components/ViewsColum'
import { SearchActorContext, usePickViewFor } from './hooks'
import { type SearchActorRef, type SearchActorSnapshot } from './searchActor'

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
  // top: 0,
  // left: 0,
  width: '100%',
  height: '100%',
  maxHeight: '100vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'stretch',
  gap: 'sm',
  paddingTop: 20,
  paddingLeft: 16,
  paddingRight: 16,
  paddingBottom: 8,
  background: '[transparent]',
  // backgroundColor: {
  //   _dark: `[rgb(34 34 34 / 0.95)]`,
  //   _light: `[rgb(255 255 255/ 0.95)]`,
  // },
})

const selectIsOpened = (s: SearchActorSnapshot) => !s.matches('inactive')

export function Search({ searchActorRef }: { searchActorRef: SearchActorRef }) {
  const isOpened = useSelector(searchActorRef, selectIsOpened)

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
    <SearchActorContext value={searchActorRef}>
      <DiagramFeatures.Overlays>
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={close}>
          <AnimatePresence>
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
                <SearchOverlay searchActorRef={searchActorRef} />
              </Overlay>
            )}
          </AnimatePresence>
        </ErrorBoundary>
      </DiagramFeatures.Overlays>
    </SearchActorContext>
  )
}

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

const SearchOverlay = ({ searchActorRef }: { searchActorRef: SearchActorRef }) => {
  const ref = useRef<HTMLDivElement>(null)
  const pickViewFor = usePickViewFor()

  useTimeoutEffect(() => {
    if (isTruthy(searchActorRef.getSnapshot().context.openedWithSearch)) {
      focusToFirstFoundElement(ref.current)
    }
  }, 150)

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
        {
          /* <Box
          css={{
            alignSelf: 'flex-start',
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 50,
          }}>
          <ActionIcon
            size={'lg'}
            variant="default"
            onClick={(e) => {
              e.stopPropagation()
              close()
            }}>
            <IconX />
          </ActionIcon>
        </Box> */
        }
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
      {pickViewFor && <PickView elementFqn={pickViewFor} />}
    </Box>
  )
}
