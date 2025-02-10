import {
  ActionIcon,
  Box,
  Group,
  Input,
  Portal,
  rem,
  RemoveScroll,
  ScrollArea,
  ScrollAreaAutosize,
  Stack,
  Title,
} from '@mantine/core'
import { useCallbackRef, useDisclosure, useFocusTrap, useFocusWithin, useHotkeys, useWindowEvent } from '@mantine/hooks'
import { IconSearch, IconX } from '@tabler/icons-react'
import { AnimatePresence, m } from 'framer-motion'
import { useRef } from 'react'
import { SearchControl } from '../../../components/SearchControl'
import { useMantinePortalProps } from '../../../hooks'
import { ElementsColumn } from './ElementsColumn'
import * as css from './LikeC4Search.css'
import {
  LikeC4SearchContext,
  setPickView,
  setSearch,
  useCloseSearch,
  usePickView,
  useSearch,
  wasResetPickView,
} from './state'
import { ViewButton, ViewsColumn } from './ViewsColum'

export function LikeC4Search() {
  const [searchOpened, searchOps] = useDisclosure(false)
  useHotkeys([
    ['mod+k', () => searchOps.toggle(), {
      preventDefault: true,
    }],
    ['mod+f', () => searchOps.toggle(), {
      preventDefault: true,
    }],
  ])

  const afterCloseCbRef = useRef<(() => void)>(null)
  const close = useCallbackRef((cb?: () => void) => {
    afterCloseCbRef.current = cb ?? null
    searchOps.close()
  })
  const onExitComplete = useCallbackRef(() => {
    if (afterCloseCbRef.current) {
      afterCloseCbRef.current()
      afterCloseCbRef.current = null
    }
  })

  const { portalProps } = useMantinePortalProps()

  return (
    <LikeC4SearchContext value={close}>
      <SearchControl
        onClick={e => {
          e.stopPropagation()
          searchOps.toggle()
        }} />
      <Portal {...portalProps}>
        <AnimatePresence initial={false} onExitComplete={onExitComplete}>
          {searchOpened && (
            <>
              <m.div
                key={'backdrop'}
                className={css.backdrop}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                }}>
              </m.div>
              <LikeC4SearchOverlay key="overlay" />
            </>
          )}
        </AnimatePresence>
      </Portal>
    </LikeC4SearchContext>
  )
}

function LikeC4SearchOverlay() {
  const close = useCloseSearch()
  const focusTrapRef = useFocusTrap()

  useWindowEvent(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        if (!wasResetPickView()) {
          close()
        }
      }
    },
    { capture: true },
  )

  return (
    <RemoveScroll>
      <m.div
        ref={focusTrapRef}
        className={css.root}
        // initial={{
        //   opacity: 0,
        //   // scale: 0.9,
        //   translateY: -20,
        // }}
        animate={{
          opacity: 1,
          scale: 1,
          translateY: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.9,
        }}
      >
        <Group wrap="nowrap">
          <Box flex={1} px={'sm'}>
            <LikeC4SearchInput />
          </Box>
          <Box flex={'0 0 auto'}>
            <ActionIcon
              size={'lg'}
              variant="default"
              onClick={(e) => {
                e.stopPropagation()
                close()
              }}>
              <IconX />
            </ActionIcon>
          </Box>
        </Group>
        <Group grow>
          <Title component={'div'} order={6} c="dimmed" pl="sm">Elements</Title>
          <Title component={'div'} order={6} c="dimmed">Views</Title>
        </Group>
        <Group
          grow
          preventGrowOverflow
          style={{
            containerName: 'likec4-search-elements',
            containerType: 'size',
            overflow: 'hidden',
            flexGrow: 1,
          }}>
          <ScrollArea type="hover" h="100cqh" pr="xs" scrollbars="y">
            <ElementsColumn />
          </ScrollArea>
          <ScrollArea type="hover" h="100cqh" pr="xs" scrollbars="y">
            <ViewsColumn />
          </ScrollArea>
        </Group>
        <Box></Box>
        <PickView />
      </m.div>
    </RemoveScroll>
  )
}

function LikeC4SearchInput() {
  const { ref, focused } = useFocusWithin()
  const search = useSearch()

  useWindowEvent(
    'keydown',
    (event) => {
      try {
        if (!focused && (event.key === 'Backspace' || event.key.match(/^\p{L}$/u))) {
          ref.current?.focus()
        }
      } catch (e) {
        console.warn(e)
      }
    },
  )

  return (
    <Input
      ref={ref}
      id="likec4searchinput"
      placeholder="Search by title, description, tag"
      tabIndex={0}
      classNames={{
        input: css.input,
      }}
      size="xl"
      value={search}
      leftSection={<IconSearch style={{ width: rem(20) }} stroke={2} />}
      onChange={(e) => setSearch(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.stopPropagation()
          document.querySelector<HTMLButtonElement>(`.${css.root} .${css.focusable}`)?.focus()
          return
        }
      }} />
  )
}

function PickView() {
  const pickview = usePickView()
  // const navigateTo = useCloseSearchAndNavigateTo()
  const focusTrapRef = useFocusTrap(!!pickview)

  return (
    <AnimatePresence>
      {pickview && (
        <>
          <m.div
            key="backdrop"
            className={css.pickviewBackdrop}
            onClick={e => {
              e.stopPropagation()
              setPickView(null)
            }}>
          </m.div>
          <m.div
            initial={{
              opacity: 0,
              scale: 0.95,
              originY: 0,
              translateX: '-50%',
              translateY: -20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              translateY: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.98,
              translateY: -20,
              transition: {
                duration: 0.1,
              },
            }}
            className={css.pickview}
            data-likec4-search-views
            ref={focusTrapRef}>
            <Group px="sm" py="md" justify="space-between">
              <Title order={2} lh={1}>Select view</Title>
              <ActionIcon
                size={'md'}
                variant="default"
                onClick={(e) => {
                  e.stopPropagation()
                  setPickView(null)
                }}>
                <IconX />
              </ActionIcon>
            </Group>

            <ScrollAreaAutosize mah={'calc(100vh - 8rem - 50px)'} type="never">
              {pickview.scoped.length > 0 && (
                <Stack gap={'sm'} px={'sm'} className={css.pickviewGroup}>
                  <Title order={6} c={'dimmed'}>scoped views of the element</Title>
                  {pickview.scoped.map((view, i) => (
                    <ViewButton
                      key={view.id}
                      view={view}
                      search={''}
                      loop
                      mod={{
                        autofocus: i === 0,
                      }}
                    />
                  ))}
                </Stack>
              )}

              {pickview.others.length > 0 && (
                <Stack gap={'sm'} px={'sm'} className={css.pickviewGroup}>
                  <Title order={6} c={'dimmed'}>views including this element</Title>
                  {pickview.others.map((view, i) => (
                    <ViewButton
                      key={view.id}
                      view={view}
                      search={''}
                      loop
                      mod={{
                        autofocus: i === 0,
                      }}
                    />
                  ))}
                </Stack>
              )}
            </ScrollAreaAutosize>
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
}
