import type { ProjectId } from '@likec4/core/types'
import { useCallbackRef } from '@likec4/diagram'
import { styled } from '@likec4/styles/jsx'
import { type Range, defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef } from 'react'
import { Count, Truncate } from '../ui/Text'
import { ProjectMonogram } from '../workspace-overview/ProjectMonogram'
import type { ResultGroup, SearchElement, SearchView } from './search-index'
import { SearchPanel } from './SearchPanel'
import type { RegisterFocus } from './useRowFocus'
const HEAD_HEIGHT = 32
const ROW_GAP = 6
const GROUP_GAP = 16

/**
 * First guess before the row is measured: title, path, and an optional one-line description
 */
function rowEstimate(item: SearchElement | SearchView): number {
  if (item.type === 'view') {
    return item.description !== '' ? 94 : 70
  }
  // element always shows summary (or "no description")
  return 75
}

type ColumnItem<T> =
  | { readonly type: 'head'; readonly key: string; readonly projectId: ProjectId; readonly count: number }
  | { readonly type: 'row'; readonly key: string; readonly item: T; readonly k: number; readonly last: boolean }

/**
 * Flattens the groups into project heads and rows; `k` counts the rows only
 */
function columnItems<T extends SearchElement | SearchView>(
  groups: ReadonlyArray<ResultGroup<T>>,
  grouped: boolean,
): {
  items: ColumnItem<T>[]
  rowIndexes: number[]
  headIndexes: number[]
} {
  const items: ColumnItem<T>[] = []
  const rowIndexes = [] as number[]
  const headIndexes = [] as number[]
  let index = 0
  let k = 0
  for (const group of groups) {
    if (grouped) {
      items.push({
        type: 'head',
        key: `head:${group.projectId}`,
        projectId: group.projectId,
        count: group.items.length,
      })
      headIndexes.push(index++)
    }
    group.items.forEach((item, i) => {
      items.push({
        type: 'row',
        key: `${item.projectId}:${item.id}`,
        item,
        k: k++,
        last: i === group.items.length - 1,
      })
      rowIndexes.push(index++)
    })
  }
  return { items, rowIndexes, headIndexes }
}

/**
 * Virtualized list of results (TanStack Virtual), with sticky project headers
 */
export function ResultColumn<T extends SearchElement | SearchView>({
  col,
  title,
  groups,
  grouped,
  titleOf,
  empty,
  renderRow,
  registerFocus,
}: {
  col: 'el' | 'vw'
  title: string
  groups: ReadonlyArray<ResultGroup<T>>
  grouped: boolean
  titleOf: (id: ProjectId) => string
  empty: string
  renderRow: (item: T, k: number) => ReactNode
  registerFocus: RegisterFocus
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { items, rowIndexes, headIndexes } = useMemo(
    () => columnItems(groups, grouped),
    [groups, grouped],
  )

  const activeHeadRef = useRef(0)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    getItemKey: index => items[index]?.key ?? index,
    estimateSize: index => {
      const item = items[index]
      switch (true) {
        case item?.type === 'head':
          return HEAD_HEIGHT
        case item?.type === 'row':
          return rowEstimate(item.item) + (item.last ? GROUP_GAP : ROW_GAP)
        default:
          return 0
      }
    },
    overscan: 8,
    // rows scrolled into view stop below the sticky project header
    scrollPaddingStart: grouped ? HEAD_HEIGHT : 0,
    rangeExtractor: useCallbackRef((range: Range) => {
      // keep the header of the group at the top rendered, it sticks
      const active = headIndexes.findLast(index => index <= range.startIndex)
      activeHeadRef.current = active ?? -1
      const next = defaultRangeExtractor(range)
      return active === undefined || next.includes(active) ? next : [active, ...next]
    }),
  })

  useEffect(() => {
    registerFocus(col, (k, giveUp) => {
      if (rowIndexes.length === 0) {
        return null
      }
      const target = Math.max(0, Math.min(k, rowIndexes.length - 1))
      const index = rowIndexes[target]!
      virtualizer.scrollToIndex(index, { align: 'auto' })
      // the row may render only after the scroll
      let attempts = 0
      const tryFocus = () => {
        const row = scrollRef.current?.querySelector<HTMLElement>(`[data-col="${col}"][data-k="${target}"]`)
        if (row) {
          row.focus({ preventScroll: true })
        } else if (attempts++ < 5) {
          requestAnimationFrame(tryFocus)
        } else {
          giveUp()
        }
      }
      tryFocus()
      return target
    })
    return () => registerFocus(col, null)
  }, [col, registerFocus, rowIndexes, virtualizer])

  // new results start from the top
  useEffect(() => {
    virtualizer.scrollToOffset(0)
  }, [items, virtualizer])

  const total = rowIndexes.length
  return (
    <SearchPanel.Column aria-label={title}>
      <SearchPanel.ColumnTitle>
        {title}
        {total > 0 && <Count>{total}</Count>}
      </SearchPanel.ColumnTitle>
      <SearchPanel.List ref={scrollRef} data-list={col}>
        {total === 0 && <SearchPanel.Hint>{empty}</SearchPanel.Hint>}
        <VirtualList style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map(virtualItem => {
            const item = items[virtualItem.index]
            if (!item) {
              return null
            }
            const projectTitle = item.type === 'head' ? titleOf(item.projectId) : ''
            const isActiveHead = item.type === 'head' && virtualItem.index === activeHeadRef.current

            const style: CSSProperties = isActiveHead
              // Active head row is sticky
              ? {
                position: 'sticky',
                zIndex: 1,
              }
              // Other rows are translated
              : {
                transform: `translateY(${virtualItem.start}px)`,
                // This ensures that the head row is above active sticky row (which has z-index: 1)
                zIndex: item.type === 'head' ? 2 : undefined,
              }

            return (
              <VirtualItem
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={style}>
                {item.type === 'head'
                  ? (
                    <SearchPanel.GroupHead>
                      <ProjectMonogram
                        projectId={item.projectId}
                        title={projectTitle}
                        size="chip"
                        aria-hidden />
                      <Truncate title={projectTitle}>{projectTitle}</Truncate>
                      <Count>{item.count}</Count>
                    </SearchPanel.GroupHead>
                  )
                  : (
                    <div style={{ paddingBottom: item.last ? GROUP_GAP : ROW_GAP }}>
                      {renderRow(item.item, item.k)}
                    </div>
                  )}
              </VirtualItem>
            )
          })}
        </VirtualList>
      </SearchPanel.List>
    </SearchPanel.Column>
  )
}

const VirtualList = styled('div', {
  base: {
    position: 'relative',
    width: '100%',
  },
})

const VirtualItem = styled('div', {
  base: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
  },
})
