// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { LikeC4Model } from '@likec4/core/model'
import { type Fqn, preferSummary } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { vstack } from '@likec4/styles/patterns'
import {
  type ElementProps,
  type UnstyledButtonProps,
  Badge,
  createScopedKeydownHandler,
  Group,
  Highlight,
  Stack,
  ThemeIcon,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core'
import { m } from 'motion/react'
import { memo, useMemo, useRef } from 'react'
import { first } from 'remeda'
import { EmptyBox } from '../../components/EmptyBox'
import { ViewIcon } from '../../components/ViewIcon'
import { useLikeC4Model } from '../../hooks/useLikeC4Model'
import { useNormalizedSearch } from '../hooks'
import { useSearchContext } from '../SearchContext'
import { buttonsva } from './_shared.css'
import { centerY, moveFocusToSearchInput, queryAllFocusable } from './utils'
import * as styles from './ViewsColumn.css'

export const NothingFound = () => (
  <EmptyBox fullsize as={m.div}>
    Nothing found
  </EmptyBox>
)

const useFoundViews = () => {
  const { currentViewId } = useSearchContext()
  const likec4model = useLikeC4Model()
  const search = useNormalizedSearch()
  return useMemo(() => {
    let views = [...likec4model.views()]
    if (search) {
      if (search.startsWith('kind:')) {
        views = []
      } else {
        const searchTag = search.startsWith('#') ? search.slice(1) : null
        views = views.filter(view => {
          if (searchTag) {
            return view.tags.some((tag) => tag.toLocaleLowerCase().includes(searchTag))
          }
          const desc = preferSummary(view.$view)?.md || ' '
          return `${view.id} ${view.title} ${desc}`.toLocaleLowerCase().includes(search)
        })
      }
    }
    return [views, search, currentViewId] as const
  }, [likec4model, search, currentViewId])
}

export const ViewsColumn = memo(() => {
  const ref = useRef<HTMLDivElement>(null)
  const [views, search, currentViewId] = useFoundViews()

  if (views.length === 0) {
    return <NothingFound key="nothing-found" />
  }

  return (
    <m.div
      key="views-column"
      ref={ref}
      layout
      className={vstack({ gap: '2' })}
      data-likec4-search-views
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          const maxY = (e.target as HTMLElement).getBoundingClientRect().y
          const elementButtons = queryAllFocusable(ref.current, 'elements', '.likec4-element-button')
          let elementButton = elementButtons.length > 1
            ? elementButtons.find((el, i, all) => centerY(el) > maxY || i === all.length - 1)
            : null
          elementButton ??= first(elementButtons)

          if (elementButton) {
            e.stopPropagation()
            elementButton.focus()
          }
          return
        }
      }}>
      {views.length > 0 && (
        <VisuallyHidden>
          <UnstyledButton
            data-likec4-view
            tabIndex={-1}
            onFocus={e => {
              e.stopPropagation()
              moveFocusToSearchInput(ref.current)
            }} />
        </VisuallyHidden>
      )}
      {views.map((view, i) => (
        <m.div layout="position" key={`@view${view.id}`}>
          <ViewButton
            view={view}
            currentViewId={currentViewId ?? ''}
            search={search}
            tabIndex={i === 0 ? 0 : -1}
          />
        </m.div>
      ))}
    </m.div>
  )
})

const btn = buttonsva()

export function ViewButton(
  { className, view, loop = false, search, focusOnElement, currentViewId, ...props }:
    & {
      view: LikeC4Model.View
      currentViewId: string
      search: string
      loop?: boolean
      focusOnElement?: Fqn
    }
    & UnstyledButtonProps
    & ElementProps<'button'>,
) {
  const ctx = useSearchContext()
  const nextViewId = view.id
  const isCurrentView = nextViewId === currentViewId

  const navigate = () => {
    ctx.navigateTo(nextViewId, focusOnElement)
  }

  return (
    <UnstyledButton
      {...props}
      className={cx(btn.root, 'group', styles.focusable, styles.viewButton, className)}
      data-likec4-view={view.id}
      {...(isCurrentView && !focusOnElement) && { 'data-disabled': true }}
      onClick={(e) => {
        e.stopPropagation()
        navigate()
      }}
      onKeyDown={createScopedKeydownHandler({
        siblingSelector: '[data-likec4-view]',
        parentSelector: '[data-likec4-search-views]',
        activateOnFocus: false,
        loop,
        orientation: 'vertical',
        onKeyDown: (e) => {
          if (e.nativeEvent.code === 'Space') {
            e.stopPropagation()
            navigate()
          }
        },
      })}>
      <ThemeIcon variant="transparent" className={btn.icon!}>
        <ViewIcon type={view._type} size={16} />
      </ThemeIcon>
      <Box style={{ flexGrow: 1 }}>
        <Group gap={'xs'} wrap="nowrap" align="center">
          <Highlight component="div" highlight={search} className={btn.title!} lineClamp={1}>
            {view.titleOrUntitled}
          </Highlight>
          {isCurrentView && <Badge size="xs" fz={9} radius={'sm'}>current</Badge>}
        </Group>
        <Highlight
          highlight={view.description.nonEmpty ? search : ''}
          component="div"
          className={btn.description!}
          lineClamp={1}>
          {view.description.text || 'No description'}
        </Highlight>
      </Box>
    </UnstyledButton>
  )
}
