// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { LikeC4ViewModel } from '@likec4/core/model'
import type { Fqn } from '@likec4/core/types'
import { ActionIcon, FocusTrap, Group, ScrollAreaAutosize, Stack, Title } from '@mantine/core'
import { useCallbackRef, useWindowEvent } from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import { useLikeC4Model } from '../../hooks/useLikeC4Model'
import { useSearchContext } from '../SearchContext'
import * as styles from './styles.css'
import { ViewButton } from './ViewsColum'

export function PickView({
  elementFqn,
}: {
  elementFqn: Fqn
}) {
  const ctx = useSearchContext()
  const currentViewId = ctx.currentViewId ?? ''
  const element = useLikeC4Model().element(elementFqn)
  const scoped = [] as LikeC4ViewModel[]
  const others = [] as LikeC4ViewModel[]

  for (const view of element.views()) {
    if (view.viewOf === element) {
      scoped.push(view)
    } else {
      others.push(view)
    }
  }

  const closePickView = () => {
    ctx.closePickView()
  }

  useWindowEvent(
    'keydown',
    useCallbackRef((event) => {
      try {
        if (event.key === 'Escape') {
          event.stopPropagation()
          event.preventDefault()
          closePickView()
        }
      } catch (e) {
        console.warn(e)
      }
    }),
    {
      capture: true,
    },
  )

  return (
    <>
      <m.div
        key="pickview-backdrop"
        className={styles.pickviewBackdrop}
        onClick={e => {
          e.stopPropagation()
          closePickView()
        }}>
      </m.div>
      <FocusTrap>
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
          data-likec4-search-views>
          <Group px="sm" py="md" justify="space-between">
            <Title order={2} lh={1}>Select view</Title>
            <ActionIcon
              size={'md'}
              variant="default"
              onClick={(e) => {
                e.stopPropagation()
                closePickView()
              }}>
              <IconX />
            </ActionIcon>
          </Group>
          <ScrollAreaAutosize mah={'calc(100vh - 110px)'} type="never">
            {scoped.length > 0 && (
              <Stack gap={'sm'} px={'sm'} className={styles.pickviewGroup}>
                <Title order={6} c={'dimmed'}>scoped views of the element</Title>
                {scoped.map((view, i) => (
                  <ViewButton
                    key={view.id}
                    view={view}
                    currentViewId={currentViewId}
                    search={''}
                    loop
                    focusOnElement={elementFqn}
                    mod={{
                      autofocus: i === 0,
                    }}
                  />
                ))}
              </Stack>
            )}

            {others.length > 0 && (
              <Stack gap={'sm'} px={'sm'} className={styles.pickviewGroup}>
                <Title order={6} c={'dimmed'}>views including this element</Title>
                {others.map((view, i) => (
                  <ViewButton
                    key={view.id}
                    view={view}
                    currentViewId={currentViewId}
                    search={''}
                    loop
                    focusOnElement={elementFqn}
                    mod={{
                      autofocus: i === 0 && scoped.length === 0,
                    }}
                  />
                ))}
              </Stack>
            )}
          </ScrollAreaAutosize>
        </m.div>
      </FocusTrap>
    </>
  )
}
