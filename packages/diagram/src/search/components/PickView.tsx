// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { LikeC4ViewModel } from '@likec4/core/model'
import type { Fqn, RelationId } from '@likec4/core/types'
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

  return (
    <PickViewDialog
      focusOnElement={elementFqn}
      groups={[
        { title: 'scoped views of the element', views: scoped },
        { title: 'views including this element', views: others },
      ]}
    />
  )
}

export function PickRelationshipView({
  relationId,
}: {
  relationId: RelationId
}) {
  const relationship = useLikeC4Model().relationship(relationId, 'model')

  return (
    <PickViewDialog
      groups={[
        { title: 'views including this relationship', views: [...relationship.views()] },
      ]}
    />
  )
}

function PickViewDialog({
  groups,
  focusOnElement,
}: {
  groups: ReadonlyArray<{ title: string; views: ReadonlyArray<LikeC4ViewModel> }>
  focusOnElement?: Fqn | undefined
}) {
  const ctx = useSearchContext()
  const currentViewId = ctx.currentViewId ?? ''
  const autofocusGroup = groups.findIndex(group => group.views.length > 0)

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
            {groups.map((group, groupIndex) =>
              group.views.length > 0 && (
                <Stack key={group.title} gap={'sm'} px={'sm'} className={styles.pickviewGroup}>
                  <Title order={6} c={'dimmed'}>{group.title}</Title>
                  {group.views.map((view, i) => (
                    <ViewButton
                      key={view.id}
                      view={view}
                      currentViewId={currentViewId}
                      search={''}
                      loop
                      {...focusOnElement && { focusOnElement }}
                      mod={{
                        autofocus: groupIndex === autofocusGroup && i === 0,
                      }}
                    />
                  ))}
                </Stack>
              )
            )}
          </ScrollAreaAutosize>
        </m.div>
      </FocusTrap>
    </>
  )
}
