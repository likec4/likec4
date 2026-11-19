import { css } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'
import { SearchPanel } from './SearchPanel'

/**
 * Keyboard hints and the indexing status
 */
export function SearchFooter({ loaded, total, failed, scopeHint }: {
  /**
   * Indexed projects
   */
  loaded: number
  total: number
  failed: number
  /**
   * Shows the `@` hint, for workspaces with several projects
   */
  scopeHint: boolean
}) {
  const loading = loaded + failed < total
  return (
    <SearchPanel.Footer className={footer}>
      <span>
        <kbd>↑</kbd>
        <kbd>↓</kbd>move
      </span>
      <span>
        <kbd>←</kbd>
        <kbd>→</kbd>elements / views
      </span>
      <span>
        <kbd>↵</kbd>open
      </span>
      {scopeHint && (
        <span>
          <kbd>@</kbd>limit to a project
        </span>
      )}
      <span>
        <kbd>esc</kbd>back · close
      </span>
      <Status loading={loading} aria-live="polite">
        {loading
          ? `Indexing ${loaded} of ${total} projects…`
          : `${loaded} ${loaded === 1 ? 'project' : 'projects'} indexed`}
        {failed > 0 && ` · ${failed} failed`}
      </Status>
    </SearchPanel.Footer>
  )
}

// not styled(SearchPanel.Footer): typing such a wrapper takes TypeScript minutes
const footer = css({
  color: 'text.dimmed',
  flexShrink: '0',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '4',
  minHeight: '[40px]',
  paddingX: '3',
  borderTopWidth: '1',
  borderTopStyle: 'solid',
  borderColor: 'border.subtle',
  fontSize: 'xs',
  '& kbd': {
    display: 'inline-block',
    minWidth: '[18px]',
    marginRight: '1',
    paddingX: '1',
    paddingY: '[1px]',
    borderRadius: 'xs',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'border.default',
    backgroundColor: 'surface.default',
    fontFamily: 'mono',
    fontSize: 'xxs',
    textAlign: 'center',
    color: 'text',
  },
})

const Status = styled('span', {
  base: {
    marginLeft: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    '&::before': {
      content: '""',
      width: '[6px]',
      height: '[6px]',
      borderRadius: '[50%]',
      backgroundColor: '[var(--mantine-color-green-6)]',
    },
  },
  variants: {
    loading: {
      true: {
        '&::before': {
          backgroundColor: '[var(--mantine-color-yellow-6)]',
        },
      },
    },
  },
})
