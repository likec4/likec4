import { LikeC4ProjectsOverview, LogoIcon, useChangeLikeC4Project } from '@likec4/diagram'
import { Menu } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { IconCheck, IconChevronDown, IconLayoutGrid, IconList, IconTopologyStar3 } from '@tabler/icons-react'
import { useLikeC4Projects } from 'likec4:projects'
import { useLikeC4ProjectsOverview } from 'likec4:projects-overview'
import { type ReactNode, useMemo, useState } from 'react'
import { ColorSchemeToggle } from '../components/ColorSchemeToggle'
import { type CatalogSort, buildProjectsCatalog, selectProjects } from '../components/projects-overview/catalog'
import { Metric, ProjectsCards, ProjectsTable } from '../components/projects-overview/ProjectsCatalog'
import * as styles from '../components/projects-overview/styles'
import { WorkspaceSearch, WorkspaceSearchTrigger } from '../components/workspace-search/WorkspaceSearch'

export type ProjectsOverviewMode = 'cards' | 'table' | 'map'

const SORT_OPTIONS: ReadonlyArray<{ value: CatalogSort; label: string }> = [
  { value: 'name', label: 'Name' },
  { value: 'elements', label: 'Elements' },
  { value: 'usedBy', label: 'Most depended on' },
]

const MODES: ReadonlyArray<{ value: ProjectsOverviewMode; label: string; icon: ReactNode }> = [
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
          <LikeC4ProjectsOverview view={projectsOverview} onNavigateToProject={changeProject} />
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
            <Menu position="bottom-start" width={200} shadow="md" withinPortal>
              <Menu.Target>
                <button type="button" className={styles.sortButton} aria-label="Sort projects">
                  Sort: {SORT_OPTIONS.find(o => o.value === sort)?.label}
                  <IconChevronDown size={14} aria-hidden />
                </button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Sort projects by</Menu.Label>
                {SORT_OPTIONS.map(o => (
                  <Menu.Item
                    key={o.value}
                    onClick={() => setSort(o.value)}
                    rightSection={o.value === sort ? <IconCheck size={14} aria-hidden /> : null}
                    aria-checked={o.value === sort}
                    role="menuitemradio">
                    {o.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </>
        )}
        <span className={styles.toolbarSpacer} />
        <div className={styles.seg} role="group" aria-label="View">
          {MODES.map(mode => (
            <button
              key={mode.value}
              type="button"
              aria-pressed={view === mode.value}
              onClick={() => onViewChange(mode.value)}>
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>
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
