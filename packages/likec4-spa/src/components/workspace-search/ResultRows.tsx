import type { ViewId } from '@likec4/core/types'
import { ViewIcon } from '@likec4/diagram'
import { css, cx } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'
import { Highlight } from '@mantine/core'
import { IconBrowser, IconCube, IconDatabase, IconDeviceMobile, IconUser } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Truncate } from '../ui/Text'
import type { SearchElement, SearchView } from './search-index'
import { SearchPanel } from './SearchPanel'

/**
 * Columns of focusable rows; rows carry `data-col` and `data-k` for the keyboard navigation
 */
export type Column = 'el' | 'vw' | 'pick'

function elementIcon(shape: string): ReactNode {
  switch (shape) {
    case 'storage':
    case 'cylinder':
      return <IconDatabase size={20} stroke={1.6} aria-hidden />
    case 'person':
      return <IconUser size={20} stroke={1.6} aria-hidden />
    case 'browser':
      return <IconBrowser size={20} stroke={1.6} aria-hidden />
    case 'mobile':
      return <IconDeviceMobile size={20} stroke={1.6} aria-hidden />
    default:
      return <IconCube size={20} stroke={1.6} aria-hidden />
  }
}

export function ElementRow({ element, k, words, onOpen }: {
  element: SearchElement
  k: number
  words: string[]
  onOpen: (element: SearchElement) => void
}) {
  const views = element.views.length
  return (
    <SearchPanel.Button type="button" className="group" data-col="el" data-k={k} onClick={() => onOpen(element)}>
      <SearchPanel.ButtonIcon>{elementIcon(element.shape)}</SearchPanel.ButtonIcon>
      <RowMain>
        <RowTitle>
          <Title>
            <Highlight component="span" highlight={words}>{element.title}</Highlight>
          </Title>
          <SearchPanel.Badge>
            <Highlight component="span" highlight={words}>{element.kind}</Highlight>
          </SearchPanel.Badge>
        </RowTitle>
        <Description>
          {element.summary
            ? <Highlight component="span" highlight={words}>{element.summary}</Highlight>
            : <span>No description</span>}
        </Description>
      </RowMain>
      <SearchPanel.ButtonMeta>
        {views === 0 ? 'no views' : `${views} ${views === 1 ? 'view' : 'views'}`}
      </SearchPanel.ButtonMeta>
    </SearchPanel.Button>
  )
}

export function ViewRow({ view, k, words, onOpen }: {
  view: SearchView
  k: number
  words: string[]
  onOpen: () => void
}) {
  return (
    <SearchPanel.Button type="button" className="group" data-col="vw" data-k={k} onClick={onOpen}>
      <SearchPanel.ButtonIcon>
        <ViewIcon view={{ id: view.id, _type: view.viewType }} size={16} />
      </SearchPanel.ButtonIcon>
      <RowMain>
        <Title>
          <Highlight component="span" highlight={words}>{view.title}</Highlight>
        </Title>
        <DescriptionCode>{view.id}</DescriptionCode>
        {view.description && (
          <Description>
            <Highlight component="span" highlight={words}>{view.description}</Highlight>
          </Description>
        )}
      </RowMain>
    </SearchPanel.Button>
  )
}

/**
 * Views of an element that is in several, to pick where to open it
 */
export function PickView({ element, projectTitle, onPick, onBack }: {
  element: SearchElement
  projectTitle: string
  onPick: (viewId: ViewId) => void
  onBack: () => void
}) {
  return (
    <SearchPanel.Column>
      <SearchPanel.ColumnTitle>
        <Truncate>
          Pick a view with <b>{element.title}</b> · {projectTitle}
        </Truncate>
        <LinkButton type="button" onClick={onBack}>Back to results</LinkButton>
      </SearchPanel.ColumnTitle>
      <SearchPanel.List>
        <PickList>
          {element.views.map((view, k) => (
            <SearchPanel.Button
              key={view.id}
              type="button"
              className="group"
              data-col="pick"
              data-k={k}
              onClick={() => onPick(view.id)}>
              <SearchPanel.ButtonIcon>
                <ViewIcon view={view} size={16} />
              </SearchPanel.ButtonIcon>
              <RowMain>
                <Title>{view.title}</Title>
                <DescriptionCode>{view.id}</DescriptionCode>
              </RowMain>
            </SearchPanel.Button>
          ))}
        </PickList>
      </SearchPanel.List>
    </SearchPanel.Column>
  )
}

const RowMain = styled('span', {
  base: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5',
    minWidth: '0',
  },
})

const RowTitle = styled('span', {
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: 'xs',
    minWidth: '0',
  },
})

// Slot components of SearchPanel are not wrapped with styled(): typing such a wrapper takes TypeScript minutes

const truncate = css({
  minWidth: '0',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

const code = css({
  fontFamily: 'mono',
  fontSize: '[11px]',
})

function Title({ children }: { children: ReactNode }) {
  return <SearchPanel.ButtonTitle className={truncate}>{children}</SearchPanel.ButtonTitle>
}

function Description({ children }: { children: ReactNode }) {
  return <SearchPanel.ButtonDescription className={truncate}>{children}</SearchPanel.ButtonDescription>
}

/**
 * View id, in the code font
 */
function DescriptionCode({ children }: { children: ReactNode }) {
  return <SearchPanel.ButtonDescription className={cx(truncate, code)}>{children}</SearchPanel.ButtonDescription>
}

const PickList = styled('div', {
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5',
    maxWidth: '[640px]',
    paddingX: '3',
  },
})

const LinkButton = styled('button', {
  base: {
    marginLeft: 'auto',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'text.link',
    fontFamily: 'body',
    fontSize: 'xs',
    fontWeight: 'medium',
    cursor: 'pointer',
    paddingX: '1',
    paddingY: '0.5',
    borderRadius: '[3px]',
    _hover: {
      textDecoration: 'underline',
    },
  },
})
