// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { css } from '@likec4/styles/css'
import { Box, VStack } from '@likec4/styles/jsx'
import { Grid, GridCol, Group, ScrollArea, Title } from '@mantine/core'
import { useHotkeys, useMergedRef } from '@mantine/hooks'
import { useTimeoutEffect } from '@react-hookz/web'
import { useSelector } from '@xstate/react'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import { forwardRef, memo, useRef } from 'react'
import { isTruthy } from 'remeda'
import { useDiagram } from '../hooks/useDiagram'
import { Overlay } from '../overlays/overlay/Overlay'
import { ElementsColumn } from './components/ElementsColumn'
import { PickView } from './components/PickView'
import { SearchByTags } from './components/SearchByTags'
import { LikeC4SearchInput } from './components/SearchInput'
import { focusToFirstFoundElement, moveFocusToSearchInput } from './components/utils'
import { ViewsColumn } from './components/ViewsColum'
import type { SearchActorRef, SearchActorSnapshot } from './searchActor'
import { useSearchContext } from './SearchContext'
import { XStateSearchAdapter } from './XStateSearchAdapter'

export const dialogCss = css({
  backgroundColor: `[rgb(34 34 34 / var(--_opacity, 95%))]`,
  _light: {
    backgroundColor: `[rgb(250 250 250 / var(--_opacity, 95%))]`,
  },
  backdropFilter: 'auto',
  backdropBlur: 'var(--_blur, 10px)',
})

export const bodyCss = css({
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
})

export const scrollAreaCss = css({
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

export const Search = memo(({ searchActorRef }: { searchActorRef: SearchActorRef }) => {
  const diagram = useDiagram()
  const isOpened = useSelector(searchActorRef, selectIsOpened)

  const close = () => {
    diagram.searchActor().send({ type: 'close' })
  }
  const open = (event: KeyboardEvent) => {
    event.stopPropagation()
    diagram.searchActor().send({ type: 'open' })
  }

  useHotkeys(
    isOpened ? [] : [
      ['mod+k', open, {
        preventDefault: true,
      }],
      ['mod+f', open, {
        preventDefault: true,
      }],
    ],
  )

  return (
    <AnimatePresence
      onExitComplete={() => {
        diagram.searchActor().send({ type: 'animation.presence.end' })
      }}>
      {isOpened && (
        <Overlay
          key="search"
          fullscreen
          withBackdrop={false}
          backdrop={{
            opacity: 0.9,
          }}
          classes={{
            dialog: dialogCss,
            body: bodyCss,
          }}
          openDelay={0}
          onClose={close}
          data-likec4-search="true"
        >
          <XStateSearchAdapter searchActorRef={searchActorRef}>
            <SearchOverlayBody searchActorRef={searchActorRef} />
          </XStateSearchAdapter>
        </Overlay>
      )}
    </AnimatePresence>
  )
})
Search.displayName = 'Search'

function SearchOverlayBody({ searchActorRef }: { searchActorRef: SearchActorRef }) {
  const ref = useRef<HTMLDivElement>(null)
  useTimeoutEffect(() => {
    if (isTruthy(searchActorRef.getSnapshot().context.openedWithSearch)) {
      focusToFirstFoundElement(ref.current)
    }
  }, 150)

  return <SearchPanelContent ref={ref} />
}

/**
 * The shared search panel content used by both diagram and overview search.
 * Must be rendered inside a SearchContext.Provider.
 */
export const SearchPanelContent = forwardRef<HTMLDivElement>((_, ref) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const { pickViewFor } = useSearchContext()

  return (
    <Box ref={useMergedRef(ref, contentRef)} display={'contents'}>
      <Group
        className={'group'}
        wrap="nowrap"
        onClick={e => {
          e.stopPropagation()
          moveFocusToSearchInput(contentRef.current)
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
            className={scrollAreaCss}
            pr="xs"
            scrollbars="y">
            <LayoutGroup id="likec4-search-elements">
              <AnimatePresence mode="popLayout" anchorY="top">
                <ElementsColumn />
              </AnimatePresence>
            </LayoutGroup>
          </ScrollArea>
        </GridCol>
        <GridCol span={6}>
          <ScrollArea
            type="scroll"
            className={scrollAreaCss}
            pr="xs"
            scrollbars="y">
            <LayoutGroup id="likec4-search-views">
              <ViewsColumn />
            </LayoutGroup>
          </ScrollArea>
        </GridCol>
      </Grid>
      {pickViewFor && <PickView elementFqn={pickViewFor} />}
    </Box>
  )
})
SearchPanelContent.displayName = 'SearchPanelContent'
