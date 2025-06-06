import { css } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import {
  ActionIcon,
  Grid,
  GridCol,
  Group,
  Portal,
  ScrollArea,
  ScrollAreaAutosize,
  Stack,
  Title,
} from '@mantine/core'
import {
  useCallbackRef,
  useDisclosure,
  useFocusReturn,
  useFocusTrap,
  useHotkeys,
  useWindowEvent,
} from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'
import { AnimatePresence, LayoutGroup, m } from 'motion/react'
import { memo, useRef } from 'react'
import { SearchControl } from '../../../components/SearchControl'
import { useMantinePortalProps } from '../../../hooks'
import { ElementsColumn } from './ElementsColumn'
import * as styles from './LikeC4Search.css'
import { LikeC4SearchInput } from './SearchInput'
import {
  LikeC4SearchContext,
  setPickView,
  useCloseSearch,
  useIsPickViewActive,
  usePickView,
  wasResetPickView,
} from './state'
import { stopAndPrevent } from './utils'
import { ViewButton, ViewsColumn } from './ViewsColum'

export const LikeC4Search = memo(() => {
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
      <Portal {...portalProps} reuseTargetNode>
        <AnimatePresence onExitComplete={onExitComplete}>
          {searchOpened && (
            <m.div
              key={'backdrop'}
              className={styles.backdrop}
              initial={{ opacity: 0.7 }}
              animate={{
                opacity: 1,
                transition: {
                  duration: 0.13,
                },
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.13,
                },
              }}>
            </m.div>
          )}
          {searchOpened && <LikeC4SearchOverlay key="overlay" />}
        </AnimatePresence>
      </Portal>
    </LikeC4SearchContext>
  )
})
LikeC4Search.displayName = 'LikeC4Search'

const LikeC4SearchOverlay = () => {
  const close = useCloseSearch()
  const pickViewActive = useIsPickViewActive()

  useWindowEvent(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        stopAndPrevent(event)
        if (!wasResetPickView()) {
          close()
        }
        return
      }
    },
  )

  return (
    <m.div
      className={styles.root}
      data-likec4-search="true"
      initial={false}
      animate={{
        opacity: 1,
        scale: 1,
        translateY: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.9,
        translateY: -30,
        transition: {
          duration: 0.13,
        },
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
            type="hover"
            className={styles.scrollArea}
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
            type="hover"
            className={styles.scrollArea}
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
      {pickViewActive && <PickView />}
    </m.div>
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
      <LayoutGroup id="likec4-search-pickview">
        {pickview && (
          <>
            <m.div
              key="backdrop"
              className={styles.pickviewBackdrop}
              onClick={e => {
                e.stopPropagation()
                setPickView(null)
              }}>
            </m.div>
            <m.div
              key="pickview"
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
              className={styles.pickview}
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
                  <Stack gap={'sm'} px={'sm'} className={styles.pickviewGroup}>
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
                  <Stack gap={'sm'} px={'sm'} className={styles.pickviewGroup}>
                    <Title order={6} c={'dimmed'}>views including this element</Title>
                    {pickview.others.map((view, i) => (
                      <ViewButton
                        key={view.id}
                        view={view}
                        search={''}
                        loop
                        mod={{
                          autofocus: i === 0 && pickview.scoped.length === 0,
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </ScrollAreaAutosize>
            </m.div>
          </>
        )}
      </LayoutGroup>
    </AnimatePresence>
  )
}
