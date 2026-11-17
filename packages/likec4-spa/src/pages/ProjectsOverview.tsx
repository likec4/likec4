import { LikeC4ProjectsOverview, LogoIcon, useChangeLikeC4Project } from '@likec4/diagram'
import { useHotkeys } from '@mantine/hooks'
import { IconLayoutGrid, IconList, IconTopologyStar3 } from '@tabler/icons-react'
import { useLikeC4Projects } from 'likec4:projects'
import { useLikeC4ProjectsOverview } from 'likec4:projects-overview'
import { type ReactNode, useMemo, useState } from 'react'
import { ColorSchemeToggle } from '../components/ColorSchemeToggle'
import { type CatalogSort, buildProjectsCatalog, selectProjects } from '../components/projects-overview/catalog'
import { Metric, ProjectsCards } from '../components/projects-overview/ProjectsCatalog'
import { ProjectsTable } from '../components/projects-overview/ProjectsTable'
import * as styles from '../components/projects-overview/styles'
import {
  type SortOption,
  type ViewModeOption,
  SortMenu,
  ViewModeSwitch,
} from '../components/projects-overview/Toolbar'
import { WorkspaceSearch, WorkspaceSearchTrigger } from '../components/workspace-search/WorkspaceSearch'

export type ProjectsOverviewMode = 'cards' | 'table' | 'map'

const SORT_OPTIONS: ReadonlyArray<SortOption<CatalogSort>> = [
  { value: 'name', label: 'Name' },
  { value: 'elements', label: 'Elements' },
  { value: 'usedBy', label: 'Most depended on' },
]

const MODES: ReadonlyArray<ViewModeOption<ProjectsOverviewMode>> = [
  { value: 'cards', label: 'Cards', icon: <IconLayoutGrid size={14} aria-hidden /> },
  { value: 'table', label: 'Table', icon: <IconList size={14} aria-hidden /> },
  { value: 'map', label: 'Map', icon: <IconTopologyStar3 size={14} aria-hidden /> },
]

export function ProjectsOverviewPage({ view, onViewChange }: {
  view: ProjectsOverviewMode
  onViewChange: (view: ProjectsOverviewMode) => void
}) {
  const changeProject = useChangeLikeC4Project()
  const projectsOverview = useLikeC4ProjectsOverview()
  const projectInfos = useLikeC4Projects()
  const catalog = useMemo(
    () => buildProjectsCatalog(projectsOverview, projectInfos),
    [projectsOverview, projectInfos],
  )

  const [sort, setSort] = useState<CatalogSort>('name')
  const [search, setSearch] = useState<{ opened: boolean; initialQuery: string }>({ opened: false, initialQuery: '' })
  const openSearch = (initialQuery = '') => setSearch({ opened: true, initialQuery })
  useHotkeys(
    search.opened ? [] : [
      ['mod+k', () => openSearch(), { preventDefault: true }],
      ['/', () => openSearch(), { preventDefault: true }],
    ],
  )

  const visible = useMemo(() => selectProjects(catalog.projects, sort), [catalog, sort])
  const { totals } = catalog
  const isMap = view === 'map'

  let content: ReactNode
  switch (true) {
    case isMap:
      content = (
        <main className={styles.mapArea}>
          <LikeC4ProjectsOverview
            view={projectsOverview}
            onNavigateToProject={changeProject}
            hideNavigationPanel
          />
        </main>
      )
      break
    case view === 'table':
      content = (
        <main>
          <ProjectsTable projects={visible} />
        </main>
      )
      break
    default:
      content = (
        <main>
          <ProjectsCards projects={visible} />
        </main>
      )
  }

  const top = (
    <>
      <section className={styles.header}>
        <div className={styles.headerTitles}>
          <LogoIcon className={styles.logo} aria-hidden />
          <h1 className={styles.title}>Projects</h1>
        </div>
        <div className={styles.summary}>
          <Metric label="Projects" value={totals.projects} size="lg" />
          <Metric label="Elements" value={totals.elements} size="lg" />
          <Metric label="Views" value={totals.views} size="lg" />
        </div>
      </section>

      <div className={styles.toolbar} role="toolbar" aria-label="Projects">
        <WorkspaceSearchTrigger onOpen={openSearch} />
        {!isMap && (
          <>
            <SortMenu options={SORT_OPTIONS} value={sort} onChange={setSort} label="Sort projects by" />
          </>
        )}
        <span className={styles.toolbarSpacer} />
        <ViewModeSwitch modes={MODES} value={view} onChange={onViewChange} />
        <ColorSchemeToggle />
      </div>
    </>
  )

  return (
    <div className={styles.page}>
      {isMap
        ? (
          <>
            {top}
            {content}
          </>
        )
        : (
          <div className={styles.pageScroll}>
            {top}
            {content}
          </div>
        )}
      <WorkspaceSearch
        opened={search.opened}
        initialQuery={search.initialQuery}
        onClose={() => setSearch(prev => ({ ...prev, opened: false }))} />
    </div>
  )
}
