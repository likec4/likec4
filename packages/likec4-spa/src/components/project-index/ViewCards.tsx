import type { ProjectId } from '@likec4/core/types'
import { StaticLikeC4Diagram, ViewIcon } from '@likec4/diagram'
import { Markdown } from '@likec4/diagram/custom'
import { cx } from '@likec4/styles/css'
import { useInViewport } from '@mantine/hooks'
import { IconFolder } from '@tabler/icons-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { randomInteger } from 'remeda'
import * as base from '../projects-overview/styles'
import * as styles from './styles'
import { type IndexView, viewTypeLabel } from './views'

/**
 * Renders the diagram only once the card is in the viewport, a bit later to keep scrolling smooth
 */
function Preview({ view }: { view: IndexView }) {
  const [visible, setVisible] = useState(false)
  const { ref, inViewport } = useInViewport()
  useEffect(() => {
    if (!inViewport || visible) return
    const tm = setTimeout(() => setVisible(true), randomInteger(10, 100))
    return () => clearTimeout(tm)
  }, [inViewport, visible])
  return (
    <div ref={ref} className={styles.preview}>
      {visible && (
        <StaticLikeC4Diagram
          background={'transparent'}
          view={view.view}
          fitView
          fitViewPadding={'12px'}
          reduceGraphics
        />
      )}
    </div>
  )
}

function ViewCard({ projectId, view }: { projectId: ProjectId; view: IndexView }) {
  return (
    <article className={cx('group', base.card)}>
      <Preview view={view} />
      <div className={styles.cardBody}>
        <div className={styles.cardHead}>
          <ViewIcon view={view} size={14} />
          <div className={base.cardTitles}>
            <h3 className={styles.viewTitle}>
              <Link
                className={base.cardLink}
                to="/project/$projectId/view/$viewId/"
                params={{ projectId, viewId: view.id }}
                title={view.title}>
                {view.title}
              </Link>
            </h3>
            {view.folder && (
              <div className={styles.meta}>
                <IconFolder size={12} aria-hidden />
                <span title={view.folder}>{view.folder}</span>
              </div>
            )}
          </div>
        </div>
        <Markdown
          value={view.description}
          textScale={0.8}
          emptyText="No description"
          className={styles.description}
        />
      </div>
    </article>
  )
}

export function ViewCards({ projectId, views }: { projectId: ProjectId; views: ReadonlyArray<IndexView> }) {
  return (
    <div className={base.grid}>
      {views.map(view => <ViewCard key={view.id} projectId={projectId} view={view} />)}
    </div>
  )
}

export function ViewsTable({ projectId, views }: { projectId: ProjectId; views: ReadonlyArray<IndexView> }) {
  const navigate = useNavigate()
  return (
    <div className={base.tableWrap}>
      <table className={base.table}>
        <thead>
          <tr>
            <th>View</th>
            <th>Folder</th>
            <th>Type</th>
            <th data-num>Nodes</th>
          </tr>
        </thead>
        <tbody>
          {views.map(view => (
            <tr
              key={view.id}
              onClick={() => {
                void navigate({ to: '/project/$projectId/view/$viewId/', params: { projectId, viewId: view.id } })
              }}>
              <td>
                <Link
                  className={base.nameCell}
                  to="/project/$projectId/view/$viewId/"
                  params={{ projectId, viewId: view.id }}
                  title={view.title}
                  onClick={e => e.stopPropagation()}>
                  <ViewIcon view={view} />
                  <span>{view.title}</span>
                </Link>
              </td>
              <td data-dimmed>{view.folder ?? '—'}</td>
              <td data-dimmed>{viewTypeLabel(view._type)}</td>
              <td data-num>{view.nodes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
