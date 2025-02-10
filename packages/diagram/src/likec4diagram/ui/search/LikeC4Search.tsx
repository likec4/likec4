import {
  ActionIcon,
  Box,
  Combobox,
  Group,
  Input,
  Portal,
  rem,
  RemoveScroll,
  ScrollArea,
  ScrollAreaAutosize,
  Stack,
  Text,
  Title,
  useCombobox,
} from '@mantine/core'
import {
  useCallbackRef,
  useDisclosure,
  useFocusReturn,
  useFocusTrap,
  useFocusWithin,
  useHotkeys,
  useMergedRef,
  useWindowEvent,
} from '@mantine/hooks'
import { useLifecycleLogger } from '@react-hookz/web'
import { IconSearch, IconX } from '@tabler/icons-react'
import { AnimatePresence, m } from 'framer-motion'
import { type ReactNode, useRef } from 'react'
import { keys } from 'remeda'
import { SearchControl } from '../../../components/SearchControl'
import { useMantinePortalProps } from '../../../hooks'
import { useLikeC4Model } from '../../../likec4model/useLikeC4Model'
import { ElementsColumn } from './ElementsColumn'
import * as css from './LikeC4Search.css'
import {
  LikeC4SearchContext,
  moveFocusToSearchInput,
  setPickView,
  setSearch,
  useCloseSearch,
  useIsPickViewActive,
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
  const { ref: forcusRef, focused } = useFocusWithin()

  const ref = useMergedRef(forcusRef, focusTrapRef)

  useWindowEvent(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        event.preventDefault()
        if (!wasResetPickView()) {
          close()
        }
        return
      }
      if (event.key === 'ArrowUp' && !focused) {
        event.stopPropagation()
        event.preventDefault()
        moveFocusToSearchInput()
      }
      if (event.key === 'ArrowDown' && !focused) {
        event.stopPropagation()
        event.preventDefault()
        document.querySelector<HTMLButtonElement>(`.${css.root} .${css.focusable}`)?.focus()
      }
    },
    // { capture: true },
  )

  useLifecycleLogger('LikeC4SearchOverlay.focused', [focused])

  return (
    <RemoveScroll>
      <m.div
        ref={ref}
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

function startingWithKind(search: string) {
  return search.match(/^k(i(nd?)?)?$/) != null
}

function LikeC4SearchInput() {
  const isPickViewActive = useIsPickViewActive()
  const likec4model = useLikeC4Model(true)
  const combobox = useCombobox()
  const { ref, focused } = useFocusWithin({
    onFocus: () => {
      combobox.openDropdown()
    },
    onBlur: () => {
      combobox.closeDropdown()
    },
  })
  const search = useSearch()

  useWindowEvent(
    'keydown',
    (event) => {
      try {
        if (!focused && !isPickViewActive && (event.key === 'Backspace' || event.key.match(/^\p{L}$/u))) {
          moveFocusToSearchInput()
        }
      } catch (e) {
        console.warn(e)
      }
    },
  )

  let options = [] as ReactNode[]

  switch (true) {
    case search.startsWith('#'): {
      const searchTag = search.toLocaleLowerCase().slice(1)
      const alloptions = likec4model.allTags().filter((tag) => tag.toLocaleLowerCase().includes(searchTag))
      options = alloptions.map((tag) => (
        <Combobox.Option value={`#${tag}`} key={tag}>
          <Text component="span" c="dimmed" mr={1} fz={'sm'}>#</Text>
          {tag}
        </Combobox.Option>
      ))
      break
    }
    case search.startsWith('kind:'):
    case startingWithKind(search): {
      const term = search.length > 6 ? search.slice(5) : ''
      let alloptions = keys(likec4model.$model.specification.elements)
      if (term) {
        alloptions = alloptions.filter((kind) => kind.toLocaleLowerCase().includes(term))
      }
      options = alloptions.map((kind) => (
        <Combobox.Option value={`kind:${kind}`} key={kind}>
          <Text component="span" c="dimmed" mr={1} fz={'sm'}>kind:</Text>
          {kind}
        </Combobox.Option>
      ))
      break
    }
  }

  // const options = ['gmail.com', 'outlook.com', 'mantine.dev'].map((item) => (
  //   <Combobox.Option value={`${search}@${item}`} key={item}>
  //     {`${search}@${item}`}
  //   </Combobox.Option>
  // ))

  return (
    <Combobox
      onOptionSubmit={(optionValue) => {
        setSearch(optionValue)
        combobox.closeDropdown()
        // Let react to display filtered elements
        setTimeout(() => {
          document.querySelector<HTMLButtonElement>(`.${css.root} .${css.focusable}`)?.focus()
        }, 50)
      }}
      width={'max-content'}
      position="bottom-start"
      shadow="md"
      offset={{
        mainAxis: 4,
        crossAxis: 50,
      }}
      resetSelectionOnOptionHover
      store={combobox}
      withinPortal={false}
    >
      <Combobox.Target>
        <Input
          ref={ref}
          id="likec4searchinput"
          placeholder="Search by title, description or start with # or kind:"
          tabIndex={0}
          classNames={{
            input: css.input,
          }}
          size="xl"
          value={search}
          leftSection={<IconSearch style={{ width: rem(20) }} stroke={2} />}
          onChange={(event) => {
            setSearch(event.currentTarget.value)
            combobox.openDropdown()
          }}
          // onClick={() => combobox.openDropdown()}
          // onFocus={() => combobox.openDropdown()}
          // onBlur={() => combobox.closeDropdown()}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && startingWithKind(search)) {
              e.stopPropagation()
              e.preventDefault()
              setSearch('kind:')
              return
            }
            if (e.key === 'Backspace' && combobox.dropdownOpened && options.length === 1) {
              if (search.startsWith('kind:')) {
                e.stopPropagation()
                e.preventDefault()
                setSearch('kind:')
              }
              return
            }
            if (e.key === 'Escape' && combobox.dropdownOpened && options.length > 0) {
              e.stopPropagation()
              e.preventDefault()
              combobox.closeDropdown()
              return
            }
            if (e.key === 'ArrowDown' && (!combobox.dropdownOpened || options.length === 0)) {
              e.stopPropagation()
              e.preventDefault()
              document.querySelector<HTMLButtonElement>(`.${css.root} .${css.focusable}`)?.focus()
              return
            }
          }} />
      </Combobox.Target>

      <Combobox.Dropdown hidden={options.length === 0} style={{ minWidth: 200 }}>
        <Combobox.Options>
          <ScrollAreaAutosize mah={'min(300px, calc(100cqh - 50px))'} type="always">
            {options}
          </ScrollAreaAutosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}

function PickView() {
  const pickview = usePickView()
  // const navigateTo = useCloseSearchAndNavigateTo()
  const focusTrapRef = useFocusTrap(!!pickview)
  useFocusReturn({
    opened: !!pickview,
  })

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
