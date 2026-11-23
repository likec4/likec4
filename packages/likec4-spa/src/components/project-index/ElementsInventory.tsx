import type { ProjectId } from '@likec4/core/types'
import { styled } from '@likec4/styles/jsx'
import { IconAlertTriangle, IconSearch } from '@tabler/icons-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { DataTable } from '../ui/DataTable'
import { Count, EmptyNote } from '../ui/Text'
import { type ElementsFilter, type ElementsIndex, type IndexElement, selectElements } from './elements'

/**
 * Kinds on the left to filter by, the matching elements in a table on the right
 */
export function ElementsInventory({ projectId, index, filter, onFilterChange }: {
  projectId: ProjectId
  index: ElementsIndex
  filter: ElementsFilter
  onFilterChange: (filter: ElementsFilter) => void
}) {
  const elements = useMemo(() => selectElements(index.elements, filter), [index, filter])
  const colors = useMemo(() => new Map(index.kinds.map(k => [k.kind, k.color])), [index])
  return (
    <Layout>
      <Kinds role="group" aria-label="Filter by kind">
        <KindButton
          type="button"
          aria-pressed={filter.kind === null}
          onClick={() => onFilterChange({ ...filter, kind: null })}>
          <KindLabel>All kinds</KindLabel>
          <Count>{index.elements.length}</Count>
        </KindButton>
        {index.kinds.map(k => (
          <KindButton
            key={k.kind}
            type="button"
            aria-pressed={filter.kind === k.kind}
            onClick={() => onFilterChange({ ...filter, kind: filter.kind === k.kind ? null : k.kind })}>
            <Swatch style={{ backgroundColor: k.color }} aria-hidden />
            <KindLabel>
              <span>{k.kind}</span>
              {k.notation && <small>{k.notation}</small>}
            </KindLabel>
            {k.notInViews > 0 && (
              <Warning title={`${k.notInViews} not in any view`}>
                <IconAlertTriangle size={14} aria-label={`${k.notInViews} not in any view`} />
              </Warning>
            )}
            <Count>{k.elements}</Count>
          </KindButton>
        ))}
      </Kinds>
      {elements.length === 0
        ? <EmptyNote>No elements match</EmptyNote>
        : <ElementsTable projectId={projectId} elements={elements} colors={colors} showKind={filter.kind === null} />}
    </Layout>
  )
}

function ElementsTable({ projectId, elements, colors, showKind }: {
  projectId: ProjectId
  elements: ReadonlyArray<IndexElement>
  colors: ReadonlyMap<string, string>
  showKind: boolean
}) {
  const navigate = useNavigate()
  return (
    <DataTable aria-label="Elements">
      <thead>
        <tr>
          <th>Element</th>
          {showKind && <th>Kind</th>}
          <th>Parent</th>
          <th>Technology</th>
          <th>Tags</th>
          <th data-num>In</th>
          <th data-num>Out</th>
          <th>Views</th>
        </tr>
      </thead>
      <tbody>
        {elements.map(el => {
          const [first] = el.views
          return (
            <tr
              key={el.id}
              aria-disabled={!first || undefined}
              onClick={first
                ? () => {
                  void navigate({
                    to: '/project/$projectId/view/$viewId/',
                    params: { projectId, viewId: first.id },
                    search: { focusOnElement: el.id },
                  })
                }
                : undefined}>
              <td>
                <ElementName>
                  <span title={el.title}>{el.title}</span>
                  <small title={el.id}>{el.id}</small>
                </ElementName>
              </td>
              {showKind && (
                <td>
                  <KindCell>
                    <Swatch style={{ backgroundColor: colors.get(el.kind) }} aria-hidden />
                    {el.kind}
                  </KindCell>
                </td>
              )}
              <td data-dimmed>{el.parent ?? '—'}</td>
              <td data-dimmed>{el.technology ?? '—'}</td>
              <td data-dimmed>{el.tags.length > 0 ? el.tags.map(tag => `#${tag}`).join(' ') : '—'}</td>
              <td data-num>{el.incoming}</td>
              <td data-num>{el.outgoing}</td>
              <td>
                {first
                  ? (
                    <ViewLinks>
                      {el.views.slice(0, 2).map(view => (
                        <Link
                          key={view.id}
                          to="/project/$projectId/view/$viewId/"
                          params={{ projectId, viewId: view.id }}
                          search={{ focusOnElement: el.id }}
                          title={view.title}
                          onClick={e => e.stopPropagation()}>
                          {view.title}
                        </Link>
                      ))}
                      {el.views.length > 2 && <Count>+{el.views.length - 2}</Count>}
                    </ViewLinks>
                  )
                  : (
                    <NotInViews>
                      <IconAlertTriangle size={14} aria-hidden />
                      Not in any view
                    </NotInViews>
                  )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </DataTable>
  )
}

/**
 * Text field that filters the elements as you type
 */
export function ElementsSearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field>
      <IconSearch size={16} aria-hidden />
      <input
        type="search"
        aria-label="Filter elements"
        placeholder="Filter by name, id, technology or tag"
        value={value}
        onChange={e => onChange(e.currentTarget.value)} />
    </Field>
  )
}

/**
 * Pressed when only the elements that are in no view are listed
 */
export function NotInViewsToggle({ count, pressed, onChange }: {
  count: number
  pressed: boolean
  onChange: (pressed: boolean) => void
}) {
  return (
    <Toggle type="button" aria-pressed={pressed} data-warning={count > 0} onClick={() => onChange(!pressed)}>
      {count > 0 && <IconAlertTriangle size={14} aria-hidden />}
      Not in any view
      <Count>{count}</Count>
    </Toggle>
  )
}

const Layout = styled('div', {
  base: {
    display: 'grid',
    gridTemplateColumns: { base: '1fr', md: '[220px minmax(0, 1fr)]' },
    alignItems: 'start',
    gap: '6',
  },
})

const Kinds = styled('div', {
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5',
    position: { md: 'sticky' },
    top: '4',
  },
})

const KindButton = styled('button', {
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    width: '100%',
    minHeight: '[36px]',
    paddingX: '3',
    paddingY: '1.5',
    borderRadius: 'sm',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'transparent',
    background: 'none',
    color: 'text',
    fontFamily: 'body',
    fontSize: 'sm',
    textAlign: 'left',
    cursor: 'pointer',
    _hover: {
      backgroundColor: 'surface.hover',
    },
    '&[aria-pressed="true"]': {
      borderColor: 'primary.border',
      backgroundColor: 'primary.body.light',
      color: 'primary.text.light',
    },
  },
})

const KindLabel = styled('span', {
  base: {
    flex: '1',
    minWidth: '0',
    display: 'flex',
    flexDirection: 'column',
    lineHeight: '[1.25]',
    '& > span': {
      fontWeight: 'medium',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '& > small': {
      fontSize: 'xs',
      color: 'text.dimmed',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
})

const Swatch = styled('span', {
  base: {
    flexShrink: '0',
    width: '[10px]',
    height: '[10px]',
    borderRadius: '[3px]',
  },
})

const Warning = styled('span', {
  base: {
    display: 'flex',
    flexShrink: '0',
    color: 'text.warning',
  },
})

const ElementName = styled('span', {
  base: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '[280px]',
    lineHeight: '[1.3]',
    '& > span': {
      fontWeight: 'medium',
      color: 'text.bright',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& > small': {
      fontFamily: 'mono',
      fontSize: 'xxs',
      color: 'text.dimmed',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
})

const KindCell = styled('span', {
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    whiteSpace: 'nowrap',
  },
})

const ViewLinks = styled('span', {
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    '& > a': {
      maxWidth: '[180px]',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: 'text.link',
      textDecoration: 'none',
      _hover: {
        textDecoration: 'underline',
      },
    },
  },
})

const NotInViews = styled('span', {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.5',
    whiteSpace: 'nowrap',
    color: 'text.warning',
  },
})

const Field = styled('label', {
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    flex: '[1 1 280px]',
    maxWidth: '[420px]',
    height: '[32px]',
    paddingLeft: '[10px]',
    paddingRight: '2',
    borderRadius: 'sm',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'border.subtle',
    backgroundColor: 'surface.field',
    color: 'text.dimmed',
    _hover: {
      borderColor: 'border.default',
    },
    _focusWithin: {
      borderColor: 'primary.border',
      boxShadow: '[0 0 0 1px var(--colors-primary-border)]',
    },
    '& > svg': {
      flexShrink: '0',
    },
    '& > input': {
      flex: '1',
      minWidth: '0',
      height: '100%',
      border: 'none',
      outline: 'none',
      background: 'none',
      color: 'text',
      fontFamily: 'body',
      fontSize: 'sm',
    },
  },
})

const Toggle = styled('button', {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.5',
    height: '[32px]',
    paddingX: '3',
    borderRadius: 'sm',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'border.subtle',
    backgroundColor: 'surface.field',
    color: 'text',
    fontFamily: 'body',
    fontSize: 'sm',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    _hover: {
      borderColor: 'border.default',
    },
    '&[data-warning="true"] > svg': {
      color: 'text.warning',
    },
    '&[aria-pressed="true"]': {
      borderColor: 'primary.border',
      backgroundColor: 'primary.body.light',
      color: 'primary.text.light',
    },
  },
})
