import { Link, useNavigate } from '@tanstack/react-router'
import { DataTable, TableName } from '../ui/DataTable'
import { formatCount } from '../ui/Text'
import type { CatalogProject } from './catalog'
import { ProjectMonogram } from './ProjectMonogram'

export function ProjectsTable({ projects }: { projects: ReadonlyArray<CatalogProject> }) {
  const navigate = useNavigate()
  return (
    <DataTable>
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
                to="/project/$projectId/"
                params={{ projectId: project.id }}
                title={project.title}
                onClick={e => e.stopPropagation()}>
                <TableName>
                  <ProjectMonogram project={project} size="sm" aria-hidden />
                  <span>{project.title}</span>
                </TableName>
              </Link>
            </td>
            <td data-dimmed>{project.id}</td>
            <td data-num>{formatCount(project.elements)}</td>
            <td data-num>{formatCount(project.relationships)}</td>
            <td data-num>{formatCount(project.views)}</td>
            <td data-dimmed>{project.dependsOn.map(l => l.title).join(', ') || '—'}</td>
            <td data-num>{project.usedBy.length}</td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  )
}
