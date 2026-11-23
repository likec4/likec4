import type { ProjectId } from '@likec4/core/types'
import { styled } from '@likec4/styles/jsx'
import { IconSearch, IconX } from '@tabler/icons-react'
import type { ComponentPropsWithRef } from 'react'
import { Truncate } from '../ui/Text'
import { ProjectMonogram } from '../workspace-overview/ProjectMonogram'
import { SearchPanel } from './SearchPanel'

/**
 * Search input with the picked project as a token before it, and the close button
 */
export function SearchField({ scope, onClearScope, onClose, ...input }: ComponentPropsWithRef<'input'> & {
  scope: { id: ProjectId; title: string } | null
  onClearScope: () => void
  onClose: () => void
}) {
  return (
    <SearchPanel.Field>
      <IconSearch size={18} aria-hidden />
      {scope && (
        <ScopeToken title={scope.title}>
          <ProjectMonogram project={scope} size="chip" aria-hidden />
          <Truncate>{scope.title}</Truncate>
          <ScopeTokenClear type="button" aria-label="Search all projects" onClick={onClearScope}>
            <IconX size={12} stroke={2.4} />
          </ScopeTokenClear>
        </ScopeToken>
      )}
      <input type="text" aria-label="Search" autoComplete="off" spellCheck={false} {...input} />
      <CloseButton type="button" aria-label="Close search" onClick={onClose}>
        <IconX size={16} />
      </CloseButton>
    </SearchPanel.Field>
  )
}

const ScopeToken = styled('span', {
  base: {
    display: 'inline-flex',
    flexShrink: '1',
    minWidth: '0',
    maxWidth: '[240px]',
    alignItems: 'center',
    gap: '1.5',
    height: '[26px]',
    paddingLeft: '[3px]',
    paddingRight: '1',
    borderRadius: 'sm',
    backgroundColor: 'primary.body.light',
    color: 'primary.text.light',
    fontSize: 'sm',
    fontWeight: 'medium',
    whiteSpace: 'nowrap',
  },
})

const ScopeTokenClear = styled('button', {
  base: {
    display: 'inline-grid',
    placeItems: 'center',
    width: '[18px]',
    height: '[18px]',
    border: 'none',
    borderRadius: '[3px]',
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    _hover: {
      backgroundColor: 'primary.body.lightHover',
    },
  },
})

const CloseButton = styled('button', {
  base: {
    color: 'text.dimmed',
    flexShrink: '0',
    display: 'inline-grid',
    placeItems: 'center',
    width: '[32px]',
    height: '[32px]',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'border.subtle',
    borderRadius: 'sm',
    backgroundColor: 'surface.default',
    cursor: 'pointer',
    _hover: {
      color: 'text',
    },
  },
})
