import type { Fqn, ProjectId, ViewId } from '@likec4/core/types'
import { useCallbackRef } from '@likec4/diagram'
import { FramerMotionConfig, Overlay } from '@likec4/diagram/custom'
import { Center } from '@likec4/styles/jsx'
import { searchOverlay } from '@likec4/styles/recipes'
import { Loader } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence } from 'motion/react'
import {
  type KeyboardEvent,
  type ReactNode,
  memo,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { ResultColumn } from './ResultColumn'
import { ElementRow, PickView, ViewRow } from './ResultRows'
import { ScopeChips } from './ScopeChips'
import { type SearchElement, searchWorkspace } from './search-index'
import { SearchField } from './SearchField'
import { SearchFooter } from './SearchFooter'
import { SearchPanel } from './SearchPanel'
import { useWorkspaceSearch, useWorkspaceSearchActions } from './store'
import { useRowFocus } from './useRowFocus'
import { useWorkspaceIndex } from './useWorkspaceIndex'

const searchClasses = searchOverlay()

/**
 * Searches elements and views of every project in the workspace.
 * Same layout and keys as the diagram search, results grouped by project.
 * Rendered by the WorkspaceSearchProvider
 */
export const WorkspaceSearch = memo(() => {
  const opened = useWorkspaceSearch(s => s.opened)
  const session = useWorkspaceSearch(s => s.session)
  const { close } = useWorkspaceSearchActions()

  // Retains dialog elements beyond unmount, so onExitComplete can close them after the exit animation.
  // Reopening during the exit mounts a new dialog (keyed by session), the exiting one is closed here.
  const dialogs = useRef(new Set<HTMLDialogElement>())
  const activeDialog = useRef<HTMLDialogElement | null>(null)
  const captureDialogRef = useCallback((node: HTMLDialogElement | null) => {
    if (node) {
      dialogs.current.add(node)
      activeDialog.current = node
    }
  }, [])
  const isOpened = useCallbackRef(() => opened)
  const handleExitComplete = useCallback(() => {
    for (const dialog of dialogs.current) {
      if (isOpened() && dialog === activeDialog.current) {
        continue
      }
      if (dialog.open) {
        dialog.close()
      }
      dialogs.current.delete(dialog)
    }
  }, [isOpened])

  return (
    <FramerMotionConfig>
      <AnimatePresence onExitComplete={handleExitComplete}>
        {opened && (
          <Overlay
            key={session}
            ref={captureDialogRef}
            aria-label="Search elements and views"
            fullscreen
            withBackdrop={false}
            backdrop={{ opacity: 0.9 }}
            classes={{ dialog: searchClasses.dialog, body: searchClasses.body }}
            openDelay={0}
            motionPreset="lift"
            onClose={() => close()}
            data-likec4-search="true"
          >
            <Suspense fallback={loader}>
              <SearchBody />
            </Suspense>
          </Overlay>
        )}
      </AnimatePresence>
    </FramerMotionConfig>
  )
})
WorkspaceSearch.displayName = 'WorkspaceSearch'

const loader = (
  <Center w="100%" style={{ height: 100 }}>
    <Loader />
  </Center>
)

function emptyText(what: string, query: string, scopeTitle: string | null): string {
  const q = query.trim()
  if (q === '') {
    return scopeTitle ? `No ${what} in ${scopeTitle}` : `No ${what}`
  }
  return scopeTitle ? `No ${what} match “${q}” in ${scopeTitle}` : `No ${what} match “${q}”`
}

function SearchBody() {
  const state = useWorkspaceIndex()
  const { index } = state
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { currentQuery, pickedScope, pick } = useWorkspaceSearch(s => ({
    currentQuery: s.query,
    pickedScope: s.scope,
    pick: s.pick,
  }))
  const query = useDeferredValue(currentQuery, '')
  const actions = useWorkspaceSearchActions()

  // a workspace with one project searches just that project: no scope chips, no groups
  const singleProject = index.projects.length === 1 ? (index.projects[0]?.id ?? null) : null
  const scope = singleProject ?? pickedScope

  const { registerFocus, focusRow, rowOf, containerProps } = useRowFocus(containerRef)

  useEffect(() => {
    const input = inputRef.current
    if (input) {
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    }
  }, [])

  const result = useMemo(() => searchWorkspace(index, query, scope), [index, query, scope])
  const titleOf = index.titleOf

  const words = useMemo(() => result.text.match(/[\p{L}\p{M}\p{N}_]+/gu) ?? [], [result.text])

  const backToInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const applyScope = useCallbackRef((projectId: ProjectId | null) => {
    actions.changeScope({ scope: projectId })
    backToInput()
  })

  const goToView = useCallbackRef((projectId: ProjectId, viewId: ViewId, focusOnElement?: Fqn) => {
    actions.close()
    void navigate({
      to: '/project/$projectId/view/$viewId/',
      params: { projectId, viewId },
      search: focusOnElement ? { focusOnElement } : {},
    })
  })

  const openElement = useCallbackRef((element: SearchElement) => {
    const [first, ...rest] = element.views
    switch (true) {
      case !first:
        return
      case rest.length === 0:
        goToView(element.projectId, first.id, element.id)
        return
      default:
        actions.pickView({ element })
    }
  })

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

  const onInputKeyDown = useCallbackRef((e: KeyboardEvent<HTMLInputElement>) => {
    // Enter confirms an IME candidate, not a search command
    if (e.nativeEvent.isComposing) {
      return
    }
    // `result` follows the deferred query: until it catches up with the typed one,
    // Enter and Tab would act on stale results
    if ((e.key === 'Enter' || e.key === 'Tab') && query !== currentQuery) {
      e.preventDefault()
      return
    }
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
        switch (true) {
          case !!pick:
            actions.cancelPick()
            break
          case query !== '' || pickedScope !== null:
            actions.reset()
            backToInput()
            break
          default:
            actions.close()
        }
        break
    }
  })

  const onRowsKeyDown = useCallbackRef((e: KeyboardEvent<HTMLDivElement>) => {
    if (!(e.target instanceof HTMLElement)) {
      return
    }
    const row = e.target.closest<HTMLElement>('[data-col]')
    if (!row) {
      return
    }
    const { col, k } = rowOf(row)
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
        if (col === 'pick') actions.cancelPick()
        backToInput()
        break
      case e.key.length === 1 && e.key !== ' ' && !e.metaKey && !e.ctrlKey && !e.altKey:
        // typing anywhere goes back to the input
        backToInput()
        break
    }
  })

  const scopeTitle = pickedScope && titleOf(pickedScope)

  let content: ReactNode
  switch (true) {
    case !!pick:
      content = (
        <PickView
          element={pick}
          projectTitle={titleOf(pick.projectId)}
          onPick={viewId => goToView(pick.projectId, viewId, pick.id)}
          onBack={() => {
            actions.cancelPick()
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
            empty={emptyText('elements', query, scopeTitle)}
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
            empty={emptyText('views', query, scopeTitle)}
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
        <SearchField
          ref={inputRef}
          value={currentQuery}
          placeholder={singleProject
            ? 'Search elements and views'
            : scope
            ? 'Search in this project'
            : 'Search elements and views in all projects'}
          scope={scope && !singleProject ? { id: scope, title: titleOf(scope) } : null}
          onClearScope={() => applyScope(null)}
          onClose={() => actions.close()}
          onChange={e => actions.changeQuery({ query: e.currentTarget.value })}
          onKeyDown={onInputKeyDown}
        />
        {!singleProject && (
          <ScopeChips
            result={result}
            scope={scope}
            indexProjects={index.projects}
            onScope={applyScope} />
        )}
      </SearchPanel.Header>
      <div ref={containerRef} onKeyDown={onRowsKeyDown} {...containerProps} style={{ display: 'contents' }}>
        {content}
      </div>
      <SearchFooter
        loaded={state.loaded}
        total={state.total}
        failed={state.failed.length}
        scopeHint={!singleProject} />
    </SearchPanel.Root>
  )
}
