import type { ProjectId } from '@likec4/core/types'
import { StaticLikeC4Diagram, ViewIcon } from '@likec4/diagram'
import { Markdown } from '@likec4/diagram/custom'
import { css } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'
import { useInViewport } from '@mantine/hooks'
import { IconFolder } from '@tabler/icons-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { randomInteger } from 'remeda'
import { Card, CardGrid, CardTitle, CardTitles } from '../ui/Card'
import { DataTable, TableName } from '../ui/DataTable'
import { type IndexView, viewTypeLabel } from './views'

export function ViewCards({ projectId, views }: { projectId: ProjectId; views: ReadonlyArray<IndexView> }) {
  return (
    <CardGrid>
      {views.map(view => <ViewCard key={view.id} projectId={projectId} view={view} />)}
    </CardGrid>
  )
}

/**
 * Preview of the diagram, title, folder and description; the title link covers the whole card
 */
function ViewCard({ projectId, view }: { projectId: ProjectId; view: IndexView }) {
  return (
    <Card>
      <Preview view={view} />
      <Body>
        <Head>
          <ViewIcon view={view} size={14} />
          <CardTitles>
            <CardTitle size="md">
              <Link to="/project/$projectId/view/$viewId/" params={{ projectId, viewId: view.id }} title={view.title}>
                {view.title}
              </Link>
            </CardTitle>
            {view.folder && (
              <Folder>
                <IconFolder size={12} aria-hidden />
                <span title={view.folder}>{view.folder}</span>
              </Folder>
            )}
          </CardTitles>
        </Head>
        <Markdown
          value={view.description}
          textScale={0.8}
          emptyText="No description"
          className={description}
        />
      </Body>
    </Card>
  )
}

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
    <PreviewBox ref={ref}>
      {visible && (
        <StaticLikeC4Diagram
          background={'transparent'}
          view={view.view}
          fitView
          fitViewPadding={'12px'}
          reduceGraphics
        />
      )}
    </PreviewBox>
  )
}

const PreviewBox = styled('div', {
  base: {
    position: 'relative',
    height: '[180px]',
    overflow: 'hidden',
    borderTopRadius: 'md',
    borderBottomWidth: '1',
    borderBottomStyle: 'solid',
    borderColor: 'border.subtle',
    backgroundColor: 'surface.canvas',
    backgroundImage: '[radial-gradient(var(--colors-diagram-background-pattern) 1px, transparent 1px)]',
    backgroundSize: '[16px 16px]',
  },
})

/**
 * Stays below the title link, so the whole card is one click target
 */
const Body = styled('div', {
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    paddingTop: '4',
    paddingX: '5',
    paddingBottom: '5',
  },
})

const Head = styled('div', {
  base: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '2',
    minWidth: '0',
    '& > svg': {
      flexShrink: '0',
      marginTop: '[3px]',
      color: 'text.dimmed',
    },
  },
})

const Folder = styled('div', {
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5',
    minWidth: '0',
    fontSize: 'xs',
    color: 'text.dimmed',
    '& > span': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
})

/**
 * Markdown description, cut to three lines however long it is
 */
const description = css({
  maxHeight: '[calc(3 * 1.5em)]',
  overflow: 'hidden',
  lineClamp: '3',
  '& :is(h1, h2, h3, h4, h5, h6)': {
    fontSize: '[1em]',
    margin: '0',
  },
  '& > * + *': {
    marginTop: '[0.25em]',
  },
})

export function ViewsTable({ projectId, views }: { projectId: ProjectId; views: ReadonlyArray<IndexView> }) {
  const navigate = useNavigate()
  return (
    <DataTable>
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
                to="/project/$projectId/view/$viewId/"
                params={{ projectId, viewId: view.id }}
                title={view.title}
                onClick={e => e.stopPropagation()}>
                <TableName>
                  <ViewIcon view={view} />
                  <span>{view.title}</span>
                </TableName>
              </Link>
            </td>
            <td data-dimmed>{view.folder ?? '—'}</td>
            <td data-dimmed>{viewTypeLabel(view._type)}</td>
            <td data-num>{view.nodes}</td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  )
}
