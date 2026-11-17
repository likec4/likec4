import { Link, useNavigate } from '@tanstack/react-router'
import type { CatalogProject } from './catalog'
import { ProjectMonogram } from './ProjectsCatalog'
import * as styles from './styles'

const numberFormat = new Intl.NumberFormat('en-US')

function formatCount(value: number | null): string {
  return value === null ? '—' : numberFormat.format(value)
}

export function ProjectsTable({ projects }: { projects: ReadonlyArray<CatalogProject> }) {
  const navigate = useNavigate()
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Project</th>
            <th>Id</th>
            <th data-num>Elements</th>
            <th data-num>Relationships</th>
            <th data-num>Views</th>
            <th>Depends on</th>
            <th data-num>Used by</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr
              key={project.id}
              onClick={() => {
                void navigate({ to: '/project/$projectId/', params: { projectId: project.id } })
              }}>
              <td>
                <Link
                  className={styles.nameCell}
                  to="/project/$projectId/"
                  params={{ projectId: project.id }}
                  title={project.title}
                  onClick={e => e.stopPropagation()}>
                  <ProjectMonogram projectId={project.id} title={project.title} size="sm" />
                  <span>{project.title}</span>
                </Link>
              </td>
              <td className={styles.cardSub}>
                {project.id}
              </td>
              <td data-num>{formatCount(project.elements)}</td>
              <td data-num>{formatCount(project.relationships)}</td>
              <td data-num>{formatCount(project.views)}</td>
              <td data-dimmed>{project.dependsOn.map(l => l.title).join(', ') || '—'}</td>
              <td data-num>{project.usedBy.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
