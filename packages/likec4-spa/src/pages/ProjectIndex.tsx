import { LogoIcon, useLikeC4Model } from '@likec4/diagram'
import { Burger } from '@mantine/core'
import { useDocumentTitle, useHotkeys } from '@mantine/hooks'
import { IconLayoutGrid, IconList } from '@tabler/icons-react'
import { pageTitle } from 'likec4:app-config'
import { type ReactNode, useMemo, useState } from 'react'
import { ColorSchemeToggle } from '../components/ColorSchemeToggle'
import * as styles from '../components/project-index/styles'
import { ViewCards, ViewsTable } from '../components/project-index/ViewCards'
import { type ViewSort, indexViews, sortViews } from '../components/project-index/views'
import { Metric } from '../components/projects-overview/ProjectsCatalog'
import * as base from '../components/projects-overview/styles'
import {
  type SortOption,
  type ViewModeOption,
  SortMenu,
  ViewModeSwitch,
} from '../components/projects-overview/Toolbar'
import { SidebarDrawer } from '../components/sidebar/Drawer'
import { SidebarDrawerOps } from '../components/sidebar/state'
import { WorkspaceSearch, WorkspaceSearchTrigger } from '../components/workspace-search/WorkspaceSearch'
import { filterLandingPageViews } from '../filterLandingPageViews'
import { useCurrentProject, useLikeC4Views } from '../hooks'

export type ProjectIndexMode = 'cards' | 'table'

const SORT_OPTIONS: ReadonlyArray<SortOption<ViewSort>> = [
  { value: 'name', label: 'Name' },
  { value: 'folder', label: 'Folder' },
  { value: 'type', label: 'Type' },
]

const MODES: ReadonlyArray<ViewModeOption<ProjectIndexMode>> = [
  { value: 'cards', label: 'Cards', icon: <IconLayoutGrid size={14} aria-hidden /> },
  { value: 'table', label: 'Table', icon: <IconList size={14} aria-hidden /> },
]

/**
 * Landing page of a single-project workspace: the project's views as cards or a table,
 * with the same header, toolbar and search as the projects page
 */
export function ProjectIndexPage({ mode, onModeChange }: {
  mode: ProjectIndexMode
  onModeChange: (mode: ProjectIndexMode) => void
}) {
  const model = useLikeC4Model()
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

  const [search, setSearch] = useState<{ opened: boolean; initialQuery: string }>({ opened: false, initialQuery: '' })
  const openSearch = (initialQuery = '') => setSearch({ opened: true, initialQuery })
  useHotkeys(
    search.opened ? [] : [
      ['mod+k', () => openSearch(), { preventDefault: true }],
      ['/', () => openSearch(), { preventDefault: true }],
    ],
  )

  let content: ReactNode
  switch (true) {
    case mode === 'table':
      content = <ViewsTable projectId={projectId} views={sorted} />
      break
    default:
      content = <ViewCards projectId={projectId} views={sorted} />
  }

  return (
    <div className={base.page}>
      <SidebarDrawer />
      <div className={base.pageScroll}>
        <section className={base.header}>
          <div className={base.headerTitles}>
            <Burger
              size="sm"
              className={styles.burger}
              onClick={SidebarDrawerOps.open}
              aria-label="Toggle navigation" />
            <LogoIcon className={base.logo} aria-hidden />
            <h1 className={base.title}>{title}</h1>
          </div>
          <div className={base.summary}>
            <Metric label="Elements" value={totals.elements} size="lg" />
            <Metric label="Relationships" value={totals.relationships} size="lg" />
            <Metric label="Views" value={views.length} size="lg" />
          </div>
        </section>

        <div className={base.toolbar} role="toolbar" aria-label="Views">
          <WorkspaceSearchTrigger onOpen={openSearch} label="Search elements and views" />
          <SortMenu options={SORT_OPTIONS} value={sort} onChange={setSort} label="Sort views by" />
          <span className={base.toolbarSpacer} />
          <ViewModeSwitch modes={MODES} value={mode} onChange={onModeChange} />
          <ColorSchemeToggle />
        </div>

        <main>{content}</main>
      </div>
      <WorkspaceSearch
        opened={search.opened}
        initialQuery={search.initialQuery}
        onClose={() => setSearch(prev => ({ ...prev, opened: false }))} />
    </div>
  )
}
