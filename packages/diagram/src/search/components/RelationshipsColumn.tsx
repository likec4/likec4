import type { LikeC4Model } from '@likec4/core/model'
import { cx } from '@likec4/styles/css'
import { Box, Txt } from '@likec4/styles/jsx'
import { vstack } from '@likec4/styles/patterns'
import { searchOverlay } from '@likec4/styles/recipes'
import {
  type ElementProps,
  type UnstyledButtonProps,
  createScopedKeydownHandler,
  Highlight,
  ThemeIcon,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core'
import { IconArrowRight, IconArrowsLeftRight } from '@tabler/icons-react'
import { m } from 'motion/react'
import { memo, useMemo, useRef } from 'react'
import { useLikeC4Model } from '../../hooks/useLikeC4Model'
import { useNormalizedSearch } from '../hooks'
import { METADATA_SEARCH_PREFIX } from '../metadata-search'
import { createRelationshipSearch } from '../relationship-search'
import { useSearchContext } from '../SearchContext'
import { ElementViewCount } from './ElementsColumn'
import { focusColumn, moveFocusToSearchInput } from './utils'
import { NothingFound } from './ViewsColum'
import * as styles from './ViewsColumn.css'

/**
 * Large models have thousands of relationships, rendering all of them would slow down every keystroke.
 */
const MAX_SHOWN = 100

const useFoundRelationships = () => {
  const likec4model = useLikeC4Model()
  const search = useNormalizedSearch()
  const relationships = useMemo(() => [...likec4model.relationships()], [likec4model])
  const searchRelationships = useMemo(() => createRelationshipSearch(relationships), [relationships])
  return useMemo(() => {
    const isFilter = search.startsWith('#') || search.startsWith('kind:') || search.startsWith(METADATA_SEARCH_PREFIX)
    return {
      found: searchRelationships(search),
      highlight: isFilter ? [] : search.split(/\s+/).filter(Boolean),
    }
  }, [searchRelationships, search])
}

export const RelationshipsColumn = memo(() => {
  const ref = useRef<HTMLDivElement>(null)
  const { found, highlight } = useFoundRelationships()

  if (found.length === 0) {
    return <NothingFound key="nothing-found" />
  }

  const shown = found.slice(0, MAX_SHOWN)

  return (
    <m.div
      key="relationships-column"
      ref={ref}
      layout
      className={vstack({ gap: '2' })}
      data-likec4-search-relationships
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          const target = e.target as HTMLElement
          const columns = e.key === 'ArrowLeft' ? ['elements'] as const : ['views'] as const
          if (focusColumn(target, target.getBoundingClientRect().y, columns)) {
            e.stopPropagation()
          }
        }
      }}>
      <VisuallyHidden>
        <UnstyledButton
          data-likec4-relationship
          tabIndex={-1}
          onFocus={e => {
            e.stopPropagation()
            moveFocusToSearchInput(ref.current)
          }} />
      </VisuallyHidden>
      {shown.map((relationship, i) => (
        <m.div layout="position" key={relationship.id}>
          <RelationshipButton
            relationship={relationship}
            highlight={highlight}
            tabIndex={i === 0 ? 0 : -1}
          />
        </m.div>
      ))}
      {found.length > shown.length && (
        <Txt size="xs" color="text.dimmed" px="3">
          {found.length - shown.length} more, refine the search to see them
        </Txt>
      )}
    </m.div>
  )
})

const btn = searchOverlay()

function RelationshipButton(
  { className, relationship: r, highlight, ...props }:
    & {
      relationship: LikeC4Model.Relationship
      highlight: string[]
    }
    & UnstyledButtonProps
    & ElementProps<'button'>,
) {
  const ctx = useSearchContext()
  const views = useMemo(() => [...r.views()], [r])
  const details = [r.title ?? 'untitled', r.technology].filter(Boolean).join(' · ')

  const select = () => {
    const [view, ...others] = views
    switch (true) {
      case !view:
        return
      case others.length === 0:
        ctx.navigateTo(view.id)
        return
      default:
        ctx.openPickViewForRelationship(r.id)
    }
  }

  return (
    <UnstyledButton
      {...props}
      className={cx(btn.button, 'group', styles.focusable, styles.viewButton, className)}
      data-likec4-relationship={r.id}
      {...views.length === 0 && { 'data-disabled': true }}
      onClick={(e) => {
        e.stopPropagation()
        select()
      }}
      onKeyDown={createScopedKeydownHandler({
        siblingSelector: '[data-likec4-relationship]',
        parentSelector: '[data-likec4-search-relationships]',
        activateOnFocus: false,
        loop: false,
        orientation: 'vertical',
        onKeyDown: (e) => {
          if (e.nativeEvent.code === 'Space') {
            e.stopPropagation()
            select()
          }
        },
      })}>
      <ThemeIcon variant="transparent" className={btn.buttonIcon!}>
        {r.isBidirectional ? <IconArrowsLeftRight size={16} /> : <IconArrowRight size={16} />}
      </ThemeIcon>
      <Box style={{ flexGrow: 1, minWidth: 0 }}>
        <Highlight component="div" highlight={highlight} className={btn.buttonTitle!} lineClamp={1}>
          {`${r.source.title} ${r.isBidirectional ? '↔' : '→'} ${r.target.title}`}
        </Highlight>
        <Highlight component="div" highlight={highlight} className={btn.buttonDescription!} lineClamp={1}>
          {details}
        </Highlight>
      </Box>
      <ElementViewCount viewsCount={views.length} />
    </UnstyledButton>
  )
}
