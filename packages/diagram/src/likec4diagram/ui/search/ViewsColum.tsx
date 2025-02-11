import {
  type LikeC4Model,
  type Tag,
  isDeploymentView,
} from '@likec4/core'
import {
  type ElementProps,
  type UnstyledButtonProps,
  Badge,
  Box,
  createScopedKeydownHandler,
  Group,
  Highlight,
  Stack,
  ThemeIcon,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core'
import { IconStack2, IconZoomScan } from '@tabler/icons-react'
import clsx from 'clsx'
import { AnimatePresence, m } from 'framer-motion'
import { first } from 'remeda'
import { useCurrentViewId } from '../../../hooks'
import { useLikeC4Model } from '../../../likec4model/useLikeC4Model'
import { emptyBoX } from './_shared.css'
import { useCloseSearchAndNavigateTo, useNormalizedSearch } from './state'
import { centerY, moveFocusToSearchInput } from './utils'
import * as css from './ViewsColumn.css'

export const NothingFound = () => (
  <Box className={emptyBoX}>
    Nothing found
  </Box>
)

export function ViewsColumn() {
  const search = useNormalizedSearch()
  let views = [...useLikeC4Model(true).views()]
  if (search) {
    if (search.startsWith('kind:')) {
      views = []
    } else {
      views = views.filter(view => {
        if (search.startsWith('#')) {
          return view.tags.some((tag: Tag) => tag.toLocaleLowerCase().includes(search.slice(1)))
        }
        return (view.title ?? '' + view.$view.description ?? '').toLocaleLowerCase().includes(search)
      })
    }
  }

  return (
    <Stack
      gap={8}
      data-likec4-search-views
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          const maxY = (e.target as HTMLElement).getBoundingClientRect().y
          const elementButtons = [...document.querySelectorAll<HTMLButtonElement>(
            `[data-likec4-search-elements] .likec4-element-button`,
          )]
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
      {views.length === 0 && <NothingFound />}
      {views.length > 0 && (
        <VisuallyHidden>
          <UnstyledButton
            data-likec4-view
            tabIndex={-1}
            onFocus={e => {
              e.stopPropagation()
              moveFocusToSearchInput()
            }} />
        </VisuallyHidden>
      )}
      <AnimatePresence>
        {views.map((view, i) => (
          <m.div layout key={view.id}>
            <ViewButton
              view={view}
              search={search}
              tabIndex={i === 0 ? 0 : -1}
            />
          </m.div>
        ))}
      </AnimatePresence>
    </Stack>
  )
}

export function ViewButton(
  { className, view, loop = false, search, ...props }:
    & {
      view: LikeC4Model.View
      search: string
      loop?: boolean
    }
    & UnstyledButtonProps
    & ElementProps<'button'>,
) {
  const navigateTo = useCloseSearchAndNavigateTo()
  const currentViewId = useCurrentViewId()
  const isCurrentView = view.id === currentViewId
  return (
    <UnstyledButton
      {...props}
      className={clsx(css.focusable, css.viewButton, className)}
      data-likec4-view={view.id}
      {...isCurrentView && { 'data-disabled': true }}
      onClick={(e) => {
        e.stopPropagation()
        navigateTo(view.id)
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
            navigateTo(view.id)
          }
        },
      })}>
      <ThemeIcon variant="transparent">
        {isDeploymentView(view)
          ? <IconStack2 stroke={1.8} />
          : <IconZoomScan stroke={1.8} />}
      </ThemeIcon>
      <Box style={{ flexGrow: 1 }}>
        <Group gap={'xs'} wrap="nowrap" align="center">
          <Highlight component="div" highlight={search} className={css.viewTitle}>
            {view.title || 'untitled'}
          </Highlight>
          {isCurrentView && <Badge size="xs" fz={9} radius={'sm'}>current</Badge>}
        </Group>
        <Highlight
          highlight={view.$view.description ? search : ''}
          component="div"
          className={css.viewDescription}
          lineClamp={1}>
          {view.$view.description || 'No description'}
        </Highlight>
      </Box>
    </UnstyledButton>
  )
}
