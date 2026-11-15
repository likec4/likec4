import type { Fqn, ProjectId, ViewId } from '@likec4/core/types'
import { ViewIcon } from '@likec4/diagram'
import { FramerMotionConfig, Overlay } from '@likec4/diagram/custom'
import { cx } from '@likec4/styles/css'
import { searchOverlay } from '@likec4/styles/recipes'
import { Highlight } from '@mantine/core'
import {
  IconBrowser,
  IconCube,
  IconDatabase,
  IconDeviceMobile,
  IconSearch,
  IconUser,
  IconX,
} from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { type Range, defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import { AnimatePresence } from 'motion/react'
import {
  type KeyboardEvent,
  type ReactNode,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ProjectMonogram } from '../projects-overview/ProjectsCatalog'
import {
  type ResultGroup,
  type SearchElement,
  type SearchResult,
  type SearchView,
  searchWorkspace,
} from './search-index'
import { SearchPanel } from './SearchPanel'
import * as styles from './styles'
import { type WorkspaceIndexState, useWorkspaceIndex } from './useWorkspaceIndex'

type Column = 'el' | 'vw' | 'pick'

const searchClasses = searchOverlay()

export interface WorkspaceSearchProps {
  opened: boolean
  /**
   * Text typed into the trigger before the overlay opened
   */
  initialQuery: string
  onClose: () => void
}

/**
 * Searches elements and views of every project in the workspace.
 * Same layout and keys as the diagram search, results grouped by project.
 */
export const WorkspaceSearch = memo(({ opened, initialQuery, onClose }: WorkspaceSearchProps) => {
  // Load on first open (or earlier, when idle); the index stays warm afterwards
  const [requested, setRequested] = useState(false)
  useEffect(() => {
    if (opened) {
      setRequested(true)
    }
  }, [opened])
  // Warm the index while the page is idle, so the first open shows results immediately
  useEffect(() => {
    if (requested) {
      return
    }
    const request = () => setRequested(true)
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(request, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(request, 300)
    return () => window.clearTimeout(id)
  }, [requested])
  const state = useWorkspaceIndex(requested)

  // Retains the dialog element beyond unmount, so onExitComplete can close it after the exit animation
  const dialogElRef = useRef<HTMLDialogElement | null>(null)
  const captureDialogRef = useCallback((node: HTMLDialogElement | null) => {
    if (node) dialogElRef.current = node
  }, [])
  const handleExitComplete = useCallback(() => {
    if (dialogElRef.current?.open) {
      dialogElRef.current.close()
    }
    dialogElRef.current = null
  }, [])

  return (
    <FramerMotionConfig>
      <AnimatePresence onExitComplete={handleExitComplete}>
        {opened && (
          <Overlay
            ref={captureDialogRef}
            fullscreen
            withBackdrop={false}
            backdrop={{ opacity: 0.9 }}
            classes={{ dialog: searchClasses.dialog, body: searchClasses.body }}
            openDelay={0}
            motionPreset="lift"
            onClose={onClose}
            data-likec4-search="true"
          >
            <SearchBody state={state} initialQuery={initialQuery} onClose={onClose} />
          </Overlay>
        )}
      </AnimatePresence>
    </FramerMotionConfig>
  )
})
WorkspaceSearch.displayName = 'WorkspaceSearch'

function SearchBody({ state, initialQuery, onClose }: {
  state: WorkspaceIndexState
  initialQuery: string
  onClose: () => void
}) {
  const { index } = state
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState(initialQuery)
  const [pickedScope, setScope] = useState<ProjectId | null>(null)
  // a workspace with one project searches just that project: no scope chips, no groups
  const singleProject = index.projects.length === 1 ? (index.projects[0]?.id ?? null) : null
  const scope = singleProject ?? pickedScope
  const [pick, setPick] = useState<SearchElement | null>(null)

  useEffect(() => {
    const input = inputRef.current
    if (input) {
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    }
  }, [])

  const result = useMemo(() => searchWorkspace(index, query, scope), [index, query, scope])
  const titleOf = useCallback(
    (projectId: ProjectId) => index.projects.find(p => p.id === projectId)?.title ?? projectId,
    [index],
  )

  const words = useMemo(() => result.text.match(/[\p{L}\p{M}\p{N}_]+/gu) ?? [], [result.text])

  // virtualized columns register how to bring a row into view and focus it
  const focusers = useRef(new Map<Column, (k: number) => number | null>())
  // row that is being scrolled into view, so fast repeated keys continue from it
  const pending = useRef<{ col: Column; k: number } | null>(null)
  const registerFocus = useCallback((col: Column, focus: ((k: number) => number | null) | null) => {
    if (focus) focusers.current.set(col, focus)
    else focusers.current.delete(col)
  }, [])

  const focusRow = useCallback((col: Column, k: number): boolean => {
    const focus = focusers.current.get(col)
    if (focus) {
      const target = focus(k)
      pending.current = target === null ? null : { col, k: target }
      return target !== null
    }
    const rows = containerRef.current?.querySelectorAll<HTMLElement>(`[data-col="${col}"]`)
    if (!rows || rows.length === 0) {
      return false
    }
    const row = rows[Math.max(0, Math.min(k, rows.length - 1))]
    row?.focus()
    row?.scrollIntoView({ block: 'nearest' })
    return true
  }, [])

  const backToInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const applyScope = useCallback((projectId: ProjectId | null) => {
    setScope(projectId)
    setQuery(q => q.replace(/^\s*@\S*\s*/, ''))
    inputRef.current?.focus()
  }, [])

  const goToView = useCallback((projectId: ProjectId, viewId: ViewId, focusOnElement?: Fqn) => {
    onClose()
    void navigate({
      to: '/project/$projectId/view/$viewId/',
      params: { projectId, viewId },
      search: focusOnElement ? { focusOnElement } : {},
    })
  }, [navigate, onClose])

  const openElement = useCallback((element: SearchElement) => {
    const [first, ...rest] = element.views
    switch (true) {
      case !first:
        return
      case rest.length === 0:
        goToView(element.projectId, first.id, element.id)
        return
      default:
        setPick(element)
    }
  }, [goToView])

  useEffect(() => {
    if (pick) {
      focusRow('pick', 0)
    }
  }, [pick, focusRow])

  const openFirst = () => {
    const element = result.elements[0]?.items[0]
    const view = result.views[0]?.items[0]
    switch (true) {
      case !!element:
        openElement(element)
        break
      case !!view:
        goToView(view.projectId, view.id)
        break
    }
  }

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const singleCandidate = result.scopeCandidates?.length === 1 ? result.scopeCandidates[0] : undefined
    switch (true) {
      case e.key === 'ArrowDown':
        e.preventDefault()
        if (!focusRow(pick ? 'pick' : 'el', 0)) focusRow('vw', 0)
        break
      case (e.key === 'Tab' || e.key === 'Enter') && !!singleCandidate:
        e.preventDefault()
        applyScope(singleCandidate ?? null)
        break
      case e.key === 'Enter':
        e.preventDefault()
        openFirst()
        break
      case e.key === 'Backspace' && pickedScope !== null && input.selectionStart === 0 && input.selectionEnd === 0:
        e.preventDefault()
        applyScope(null)
        break
      case e.key === 'Escape':
        e.preventDefault()
        e.stopPropagation()
        if (pick) {
          setPick(null)
        } else if (query !== '' || pickedScope !== null) {
          setQuery('')
          applyScope(null)
        } else {
          onClose()
        }
        break
    }
  }

  const onRowsKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!(e.target instanceof HTMLElement)) {
      return
    }
    const row = e.target.closest<HTMLElement>('[data-col]')
    if (!row) {
      return
    }
    const col = row.dataset['col'] as Column
    const k = pending.current?.col === col ? pending.current.k : Number(row.dataset['k'])
    switch (true) {
      case e.key === 'ArrowDown':
        e.preventDefault()
        focusRow(col, k + 1)
        break
      case e.key === 'ArrowUp':
        e.preventDefault()
        if (k === 0) backToInput()
        else focusRow(col, k - 1)
        break
      case e.key === 'ArrowRight' && col === 'el':
        e.preventDefault()
        focusRow('vw', k)
        break
      case e.key === 'ArrowLeft' && col === 'vw':
        e.preventDefault()
        focusRow('el', k)
        break
      case e.key === 'Escape':
        e.preventDefault()
        e.stopPropagation()
        if (col === 'pick') setPick(null)
        backToInput()
        break
      case e.key.length === 1 && e.key !== ' ' && !e.metaKey && !e.ctrlKey && !e.altKey:
        // typing anywhere goes back to the input
        backToInput()
        break
    }
  }

  let content: ReactNode
  switch (true) {
    case !!pick:
      content = (
        <PickView
          element={pick}
          projectTitle={titleOf(pick.projectId)}
          onPick={viewId => goToView(pick.projectId, viewId, pick.id)}
          onBack={() => {
            setPick(null)
            backToInput()
          }}
        />
      )
      break
    default:
      content = (
        <SearchPanel.Columns>
          <ResultColumn
            col="el"
            registerFocus={registerFocus}
            title="Elements"
            groups={result.elements}
            grouped={scope === null}
            titleOf={titleOf}
            empty={emptyText('elements', query, pickedScope && titleOf(pickedScope))}
            renderRow={(item, k) => (
              <ElementRow
                key={item.id}
                element={item}
                k={k}
                words={words}
                onOpen={openElement} />
            )}
          />
          <ResultColumn
            col="vw"
            registerFocus={registerFocus}
            title="Views"
            groups={result.views}
            grouped={scope === null}
            titleOf={titleOf}
            empty={emptyText('views', query, pickedScope && titleOf(pickedScope))}
            renderRow={(item, k) => (
              <ViewRow
                key={item.id}
                view={item}
                k={k}
                words={words}
                onOpen={() => goToView(item.projectId, item.id)} />
            )}
          />
        </SearchPanel.Columns>
      )
  }

  return (
    <SearchPanel.Root>
      <SearchPanel.Header className="group">
        <SearchPanel.Field>
          <IconSearch size={18} aria-hidden />
          {scope && !singleProject && (
            <span className={styles.scopeToken} title={titleOf(scope)}>
              <ProjectMonogram projectId={scope} title={titleOf(scope)} size="chip" />
              <span className={styles.truncate}>{titleOf(scope)}</span>
              <button type="button" aria-label="Search all projects" onClick={() => applyScope(null)}>
                <IconX size={12} stroke={2.4} />
              </button>
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder={singleProject
              ? 'Search elements and views'
              : scope
              ? 'Search in this project'
              : 'Search elements and views in all projects'}
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
            onChange={e => {
              setQuery(e.currentTarget.value)
              setPick(null)
            }}
            onKeyDown={onInputKeyDown}
          />
          <button type="button" className={styles.close} aria-label="Close search" onClick={onClose}>
            <IconX size={16} />
          </button>
        </SearchPanel.Field>
        {!singleProject && (
          <ScopeChips
            result={result}
            scope={scope}
            totalProjects={index.projects.length}
            titleOf={titleOf}
            onScope={applyScope} />
        )}
      </SearchPanel.Header>
      <div
        ref={containerRef}
        onKeyDown={onRowsKeyDown}
        onPointerDown={() => {
          pending.current = null
        }}
        onFocus={e => {
          const target = e.target
          if (
            target instanceof HTMLElement
            && pending.current
            && target.dataset['col'] === pending.current.col
            && Number(target.dataset['k']) === pending.current.k
          ) {
            pending.current = null
          }
        }}
        style={{ display: 'contents' }}>
        {content}
      </div>
      <Footer state={state} singleProject={singleProject !== null} />
    </SearchPanel.Root>
  )
}

function emptyText(what: string, query: string, scopeTitle: string | null): string {
  const q = query.trim()
  if (q === '') {
    return scopeTitle ? `No ${what} in ${scopeTitle}` : `No ${what}`
  }
  return scopeTitle ? `No ${what} match “${q}” in ${scopeTitle}` : `No ${what} match “${q}”`
}

function ScopeChips({ result, scope, totalProjects, titleOf, onScope }: {
  result: SearchResult
  totalProjects: number
  scope: ProjectId | null
  titleOf: (id: ProjectId) => string
  onScope: (id: ProjectId | null) => void
}) {
  // with `@prefix`, offer the matching projects; otherwise projects with matches, most first
  const ids = result.scopeCandidates ?? [...result.counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
  const without = result.scopeCandidates ? 0 : Math.max(0, totalProjects - result.counts.size)
  return (
    <SearchPanel.Tags role="group" aria-label="Limit to project">
      <button
        type="button"
        className={styles.scope}
        data-all
        aria-pressed={scope === null && !result.scopeCandidates}
        onClick={() => onScope(null)}>
        All projects <span className={styles.count} data-count>{result.total}</span>
      </button>
      {ids.map(id => (
        <button
          key={id}
          type="button"
          className={styles.scope}
          aria-pressed={scope === id}
          title={titleOf(id)}
          onClick={() => onScope(id)}>
          <ProjectMonogram projectId={id} title={titleOf(id)} size="chip" />
          <span className={styles.truncate}>{titleOf(id)}</span>
          <span className={styles.count} data-count>{result.counts.get(id) ?? 0}</span>
        </button>
      ))}
      {without > 0 && <span className={styles.scopeNone}>{without} with no matches</span>}
    </SearchPanel.Tags>
  )
}

type ColumnItem<T> =
  | { readonly type: 'head'; readonly key: string; readonly projectId: ProjectId; readonly count: number }
  | { readonly type: 'row'; readonly key: string; readonly item: T; readonly k: number; readonly last: boolean }

function columnItems<T extends SearchElement | SearchView>(
  groups: ReadonlyArray<ResultGroup<T>>,
  grouped: boolean,
): ColumnItem<T>[] {
  const items: ColumnItem<T>[] = []
  let k = 0
  for (const group of groups) {
    if (grouped) {
      items.push({
        type: 'head',
        key: `head:${group.projectId}`,
        projectId: group.projectId,
        count: group.items.length,
      })
    }
    group.items.forEach((item, i) => {
      items.push({
        type: 'row',
        key: `${item.projectId}:${item.id}`,
        item,
        k: k++,
        last: i === group.items.length - 1,
      })
    })
  }
  return items
}

/**
 * Virtualized list of results (TanStack Virtual), with sticky project headers
 */
function ResultColumn<T extends SearchElement | SearchView>({
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
  registerFocus: (col: Column, focus: ((k: number) => number | null) | null) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const items = useMemo(() => columnItems(groups, grouped), [groups, grouped])
  const rowIndexes = useMemo(
    () => items.flatMap((item, index) => (item.type === 'row' ? [index] : [])),
    [items],
  )
  const headIndexes = useMemo(
    () => items.flatMap((item, index) => (item.type === 'head' ? [index] : [])),
    [items],
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
    rangeExtractor: useCallback((range: Range) => {
      // keep the header of the group at the top rendered, it sticks
      const active = headIndexes.findLast(index => index <= range.startIndex)
      activeHeadRef.current = active ?? -1
      const next = defaultRangeExtractor(range)
      return active === undefined || next.includes(active) ? next : [active, ...next]
    }, [headIndexes]),
  })

  useEffect(() => {
    registerFocus(col, (k: number) => {
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
        {total > 0 && <span className={styles.count}>{total}</span>}
      </SearchPanel.ColumnTitle>
      <SearchPanel.List ref={scrollRef} data-list={col}>
        {total === 0 && <SearchPanel.Hint>{empty}</SearchPanel.Hint>}
        <div className={styles.virtualInner} style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map(virtualItem => {
            const item = items[virtualItem.index]
            if (!item) {
              return null
            }
            const isActiveHead = item.type === 'head' && virtualItem.index === activeHeadRef.current
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className={styles.virtualItem}
                data-sticky={isActiveHead || undefined}
                style={isActiveHead ? undefined : { transform: `translateY(${virtualItem.start}px)` }}>
                {item.type === 'head'
                  ? (
                    <SearchPanel.GroupHead>
                      <ProjectMonogram projectId={item.projectId} title={titleOf(item.projectId)} size="chip" />
                      <span className={styles.truncate} title={titleOf(item.projectId)}>{titleOf(item.projectId)}</span>
                      <span className={styles.count}>{item.count}</span>
                    </SearchPanel.GroupHead>
                  )
                  : (
                    <div style={{ paddingBottom: item.last ? GROUP_GAP : ROW_GAP }}>
                      {renderRow(item.item, item.k)}
                    </div>
                  )}
              </div>
            )
          })}
        </div>
      </SearchPanel.List>
    </SearchPanel.Column>
  )
}

const HEAD_HEIGHT = 32
const ROW_GAP = 6
const GROUP_GAP = 16

/**
 * First guess before the row is measured: title, path, and an optional one-line description
 */
function rowEstimate(item: SearchElement | SearchView): number {
  const hasDescription = item.type === 'element' ? item.summary !== '' : item.description !== ''
  return hasDescription ? 74 : 56
}

function elementIcon(shape: string): ReactNode {
  switch (shape) {
    case 'storage':
    case 'cylinder':
      return <IconDatabase size={20} stroke={1.6} aria-hidden />
    case 'person':
      return <IconUser size={20} stroke={1.6} aria-hidden />
    case 'browser':
      return <IconBrowser size={20} stroke={1.6} aria-hidden />
    case 'mobile':
      return <IconDeviceMobile size={20} stroke={1.6} aria-hidden />
    default:
      return <IconCube size={20} stroke={1.6} aria-hidden />
  }
}

function ElementRow({ element, k, words, onOpen }: {
  element: SearchElement
  k: number
  words: string[]
  onOpen: (element: SearchElement) => void
}) {
  const views = element.views.length
  return (
    <SearchPanel.Button type="button" className="group" data-col="el" data-k={k} onClick={() => onOpen(element)}>
      <SearchPanel.ButtonIcon>{elementIcon(element.shape)}</SearchPanel.ButtonIcon>
      <span className={styles.rowMain}>
        <span className={styles.rowTitle}>
          <SearchPanel.ButtonTitle className={styles.truncate}>
            <Highlight component="span" highlight={words}>{element.title}</Highlight>
          </SearchPanel.ButtonTitle>
          <SearchPanel.Badge>
            <Highlight component="span" highlight={words}>{element.kind}</Highlight>
          </SearchPanel.Badge>
        </span>
        <SearchPanel.ButtonDescription className={styles.rowPath}>
          <Highlight component="span" highlight={words}>{element.id}</Highlight>
        </SearchPanel.ButtonDescription>
        {element.summary && (
          <SearchPanel.ButtonDescription className={styles.truncate}>
            <Highlight component="span" highlight={words}>{element.summary}</Highlight>
          </SearchPanel.ButtonDescription>
        )}
      </span>
      <SearchPanel.ButtonMeta>
        {views === 0 ? 'no views' : `${views} ${views === 1 ? 'view' : 'views'}`}
      </SearchPanel.ButtonMeta>
    </SearchPanel.Button>
  )
}

function ViewRow({ view, k, words, onOpen }: {
  view: SearchView
  k: number
  words: string[]
  onOpen: () => void
}) {
  return (
    <SearchPanel.Button type="button" className="group" data-col="vw" data-k={k} onClick={onOpen}>
      <SearchPanel.ButtonIcon>
        <ViewIcon view={{ id: view.id, _type: view.viewType }} size={16} />
      </SearchPanel.ButtonIcon>
      <span className={styles.rowMain}>
        <SearchPanel.ButtonTitle className={styles.truncate}>
          <Highlight component="span" highlight={words}>{view.title}</Highlight>
        </SearchPanel.ButtonTitle>
        <SearchPanel.ButtonDescription className={styles.rowPath}>
          <Highlight component="span" highlight={[]}>{view.id}</Highlight>
        </SearchPanel.ButtonDescription>
        {view.description && (
          <SearchPanel.ButtonDescription className={styles.truncate}>
            <Highlight component="span" highlight={words}>{view.description}</Highlight>
          </SearchPanel.ButtonDescription>
        )}
      </span>
    </SearchPanel.Button>
  )
}

function PickView({ element, projectTitle, onPick, onBack }: {
  element: SearchElement
  projectTitle: string
  onPick: (viewId: ViewId) => void
  onBack: () => void
}) {
  return (
    <SearchPanel.Column>
      <SearchPanel.ColumnTitle>
        <span className={styles.truncate}>
          Pick a view with <b>{element.title}</b> · {projectTitle}
        </span>
        <button type="button" className={styles.linkButton} onClick={onBack}>Back to results</button>
      </SearchPanel.ColumnTitle>
      <SearchPanel.List>
        <div className={styles.pickList}>
          <div className={styles.rows}>
            {element.views.map((view, k) => (
              <SearchPanel.Button
                key={view.id}
                type="button"
                className="group"
                data-col="pick"
                data-k={k}
                onClick={() => onPick(view.id)}>
                <SearchPanel.ButtonIcon>
                  <ViewIcon view={view} size={16} />
                </SearchPanel.ButtonIcon>
                <span className={styles.rowMain}>
                  <SearchPanel.ButtonTitle className={styles.truncate}>
                    <Highlight component="span" highlight={[]}>{view.title}</Highlight>
                  </SearchPanel.ButtonTitle>
                  <SearchPanel.ButtonDescription className={styles.rowPath}>
                    <Highlight component="span" highlight={[]}>{view.id}</Highlight>
                  </SearchPanel.ButtonDescription>
                </span>
              </SearchPanel.Button>
            ))}
          </div>
        </div>
      </SearchPanel.List>
    </SearchPanel.Column>
  )
}

function Footer({ state, singleProject }: { state: WorkspaceIndexState; singleProject: boolean }) {
  const loading = state.loaded + state.failed.length < state.total
  return (
    <SearchPanel.Footer className={styles.foot}>
      <span>
        <kbd>↑</kbd>
        <kbd>↓</kbd>move
      </span>
      <span>
        <kbd>←</kbd>
        <kbd>→</kbd>elements / views
      </span>
      <span>
        <kbd>↵</kbd>open
      </span>
      {!singleProject && (
        <span>
          <kbd>@</kbd>limit to a project
        </span>
      )}
      <span>
        <kbd>esc</kbd>back · close
      </span>
      <span className={styles.status} data-loading={loading || undefined} aria-live="polite">
        {loading
          ? `Indexing ${state.loaded} of ${state.total} projects…`
          : `${state.loaded} ${state.loaded === 1 ? 'project' : 'projects'} indexed`}
        {state.failed.length > 0 && ` · ${state.failed.length} failed`}
      </span>
    </SearchPanel.Footer>
  )
}

/**
 * Field on the projects page that opens the workspace search; typing into it opens the search with that text
 */
export function WorkspaceSearchTrigger({
  onOpen,
  label = 'Search elements and views in all projects',
}: {
  onOpen: (initialQuery: string) => void
  label?: string
}) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <button
      type="button"
      className={cx('group', styles.trigger)}
      aria-label={label}
      aria-keyshortcuts="Meta+K /"
      onClick={() => onOpen('')}
      onKeyDown={e => {
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && e.key !== ' ') {
          e.preventDefault()
          onOpen(e.key)
        }
      }}>
      <IconSearch size={16} aria-hidden />
      <span>{label}</span>
      <span className={styles.kbd} aria-hidden="true">{isMac ? '⌘ + K' : 'Ctrl + K'}</span>
    </button>
  )
}
