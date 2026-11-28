import { Burger } from '@mantine/core'
import { useDocumentTitle } from '@mantine/hooks'
import { IconLayoutGrid, IconList } from '@tabler/icons-react'
import { pageTitle } from 'likec4:app-config'
import { type KeyboardEvent, useMemo, useRef, useState } from 'react'
import { ColorSchemeToggle } from '../components/ColorSchemeToggle'
import { type ElementsFilter, type ElementSort, indexElements } from '../components/project-index/elements'
import {
  ElementsInventory,
  ElementsSearchField,
  NotInViewsToggle,
} from '../components/project-index/ElementsInventory'
import { ViewCards, ViewsTable } from '../components/project-index/ViewCards'
import { type ViewSort, indexViews, sortViews } from '../components/project-index/views'
import { SidebarDrawer } from '../components/sidebar/Drawer'
import { SidebarDrawerOps } from '../components/sidebar/state'
import { Metric, MetricsRow } from '../components/ui/Metric'
import {
  Page,
  PageHeader,
  PageHeading,
  PageLogo,
  PageScroll,
  PageSection,
  PageTab,
  PageTabs,
  PageTitle,
  Toolbar,
  ToolbarSpacer,
} from '../components/ui/Page'
import { type SortOption, type ViewModeOption, SortMenu, ViewModeSwitch } from '../components/ui/Toolbar'
import { WorkspaceSearchTrigger } from '../components/workspace-search/SearchTrigger'
import { WorkspaceSearchProvider } from '../components/workspace-search/WorkspaceSearchProvider'
import { filterLandingPageViews } from '../filterLandingPageViews'
import { useCurrentProject, useLikeC4Views, useProjectModel } from '../hooks'

export type ProjectIndexMode = 'cards' | 'table'

export type ProjectIndexSection = 'views' | 'elements'

const SORT_OPTIONS: ReadonlyArray<SortOption<ViewSort>> = [
  { value: 'name', label: 'Name' },
  { value: 'folder', label: 'Folder' },
  { value: 'type', label: 'Type' },
]

const ELEMENT_SORT_OPTIONS: ReadonlyArray<SortOption<ElementSort>> = [
  { value: 'name', label: 'Name' },
  { value: 'kind', label: 'Kind' },
  { value: 'relationships', label: 'Most connected' },
]

const SECTIONS: ReadonlyArray<{ value: ProjectIndexSection; label: string }> = [
  { value: 'views', label: 'Views' },
  { value: 'elements', label: 'Elements' },
]

const MODES: ReadonlyArray<ViewModeOption<ProjectIndexMode>> = [
  { value: 'cards', label: 'Cards', icon: <IconLayoutGrid size={14} aria-hidden /> },
  { value: 'table', label: 'Table', icon: <IconList size={14} aria-hidden /> },
]

/**
 * Landing page of a single-project workspace: the project's views as cards or a table,
 * or its elements by kind, with the same header, toolbar and search as the projects page
 */
export function ProjectIndexPage({ section, onSectionChange, mode, onModeChange }: {
  section: ProjectIndexSection
  onSectionChange: (section: ProjectIndexSection) => void
  mode: ProjectIndexMode
  onModeChange: (mode: ProjectIndexMode) => void
}) {
  const model = useProjectModel()
  const allViews = useLikeC4Views()
  const { id: projectId, landingPage, title: projectTitle } = useCurrentProject()
  const title = projectTitle ?? pageTitle
  useDocumentTitle(title)

  const views = useMemo(
    () => indexViews(model, filterLandingPageViews(allViews, landingPage)),
    [model, allViews, landingPage],
  )
  const totals = useMemo(() => ({
    elements: [...model.elements()].filter(e => !e.imported).length,
    relationships: [...model.relationships()].length,
  }), [model])

  const [sort, setSort] = useState<ViewSort>('name')
  const sorted = useMemo(() => sortViews(views, sort), [views, sort])

  const elements = useMemo(() => section === 'elements' ? indexElements(model) : null, [model, section])
  const [filter, setFilter] = useState<ElementsFilter>({ kind: null, notInViews: false, search: '', sort: 'name' })

  return (
    <WorkspaceSearchProvider>
      <Page>
        <SidebarDrawer />
        <PageScroll>
          <PageHeader>
            <PageHeading>
              <Burger size="sm" flex="none" onClick={SidebarDrawerOps.open} aria-label="Toggle navigation" />
              <PageLogo />
              <PageTitle>{title}</PageTitle>
            </PageHeading>
            <MetricsRow>
              <Metric label="Elements" value={totals.elements} size="lg" />
              <Metric label="Relationships" value={totals.relationships} size="lg" />
              <Metric label="Views" value={views.length} size="lg" />
            </MetricsRow>
          </PageHeader>

          <SectionTabs section={section} onChange={onSectionChange} />

          <div role="tabpanel" id={panelId(section)} aria-labelledby={tabId(section)}>
            {elements
              ? (
                <>
                  <Toolbar role="toolbar" aria-label="Elements">
                    <ElementsSearchField value={filter.search} onChange={search => setFilter({ ...filter, search })} />
                    <SortMenu
                      options={ELEMENT_SORT_OPTIONS}
                      value={filter.sort}
                      onChange={sort => setFilter({ ...filter, sort })}
                      label="Sort elements by" />
                    <NotInViewsToggle
                      count={elements.notInViews}
                      pressed={filter.notInViews}
                      onChange={notInViews => setFilter({ ...filter, notInViews })} />
                    <ToolbarSpacer />
                    <ColorSchemeToggle />
                  </Toolbar>
                  <PageSection as="main">
                    <ElementsInventory
                      projectId={projectId}
                      index={elements}
                      filter={filter}
                      onFilterChange={setFilter} />
                  </PageSection>
                </>
              )
              : (
                <>
                  <Toolbar role="toolbar" aria-label="Views">
                    <WorkspaceSearchTrigger label="Search elements and views" />
                    <SortMenu options={SORT_OPTIONS} value={sort} onChange={setSort} label="Sort views by" />
                    <ToolbarSpacer />
                    <ViewModeSwitch modes={MODES} value={mode} onChange={onModeChange} />
                    <ColorSchemeToggle />
                  </Toolbar>
                  <PageSection as="main">
                    {mode === 'table'
                      ? <ViewsTable projectId={projectId} views={sorted} />
                      : <ViewCards projectId={projectId} views={sorted} />}
                  </PageSection>
                </>
              )}
          </div>
        </PageScroll>
      </Page>
    </WorkspaceSearchProvider>
  )
}

const tabId = (section: ProjectIndexSection) => `project-index-tab-${section}`
const panelId = (section: ProjectIndexSection) => `project-index-panel-${section}`

/**
 * Tabs with arrow-key navigation: only the selected tab is in the Tab order
 */
function SectionTabs({ section, onChange }: {
  section: ProjectIndexSection
  onChange: (section: ProjectIndexSection) => void
}) {
  const tabs = useRef(new Map<ProjectIndexSection, HTMLButtonElement>())
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const current = SECTIONS.findIndex(s => s.value === section)
    let next: number
    switch (e.key) {
      case 'ArrowRight':
        next = (current + 1) % SECTIONS.length
        break
      case 'ArrowLeft':
        next = (current - 1 + SECTIONS.length) % SECTIONS.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = SECTIONS.length - 1
        break
      default:
        return
    }
    const target = SECTIONS[next]
    if (!target) return
    e.preventDefault()
    onChange(target.value)
    tabs.current.get(target.value)?.focus()
  }
  return (
    <PageTabs role="tablist" aria-label="Project index">
      {SECTIONS.map(s => (
        <PageTab
          key={s.value}
          ref={el => {
            if (el) tabs.current.set(s.value, el)
          }}
          type="button"
          role="tab"
          id={tabId(s.value)}
          aria-selected={section === s.value}
          aria-controls={section === s.value ? panelId(s.value) : undefined}
          tabIndex={section === s.value ? 0 : -1}
          onKeyDown={onKeyDown}
          onClick={() => onChange(s.value)}>
          {s.label}
        </PageTab>
      ))}
    </PageTabs>
  )
}
