import type { ProjectId } from '@likec4/core/types'
import { ViewIcon } from '@likec4/diagram'
import { css, cx } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'
import { searchOverlay } from '@likec4/styles/recipes'
import { HoverCard } from '@mantine/core'
import { IconAlertTriangleFilled } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { type KeyboardEvent, memo, Suspense, useRef } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Detail } from '../ui/Detail'
import { FieldLabel, Truncate } from '../ui/Text'
import { type DriftedView, useProjectDrifts } from './useProjectDrifts'

/**
 * Warning on a project card when views of the project drifted from the model.
 * Loads the project model on its own, so the card renders without waiting
 */
export const ProjectDrifts = memo(({ projectId }: { projectId: ProjectId }) => (
  <ErrorBoundary
    fallbackRender={({ error }) => (
      <Detail dimmed>
        <span>{error instanceof Error ? error.message : String(error)}</span>
      </Detail>
    )}>
    <Suspense fallback={null}>
      <ProjectDriftsLoaded projectId={projectId} />
    </Suspense>
  </ErrorBoundary>
))
ProjectDrifts.displayName = 'ProjectDrifts'

function ProjectDriftsLoaded({ projectId }: { projectId: ProjectId }) {
  const drifts = useProjectDrifts(projectId)
  if (drifts.length === 0) {
    return null
  }
  return <DriftsBadge projectId={projectId} drifts={drifts} />
}

/**
 * Pill with the number of drifted views; hover lists them
 */
function DriftsBadge({ projectId, drifts }: { projectId: ProjectId; drifts: ReadonlyArray<DriftedView> }) {
  const listRef = useRef<HTMLDivElement>(null)
  // the list opens on focus; Enter or Space moves focus into it (it is in a portal, Tab does not reach it)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      listRef.current?.querySelector<HTMLElement>('a')?.focus()
    }
  }
  return (
    <HoverCard
      openDelay={250}
      closeDelay={120}
      position="bottom-start"
      width={320}
      floatingStrategy="fixed"
      shadow="md"
      withinPortal>
      <HoverCard.Target>
        {/* focusable, so the list opens on keyboard focus too */}
        <Badge
          tabIndex={0}
          role="button"
          aria-haspopup="dialog"
          onKeyDown={onKeyDown}
          aria-label={`${drifts.length} view${drifts.length === 1 ? '' : 's'} drifted, show the list`}>
          <BadgeIcon size={14} aria-hidden />
          <BadgeText>
            {drifts.length} view{drifts.length === 1 ? '' : 's'} drifted
          </BadgeText>
        </Badge>
      </HoverCard.Target>
      <HoverCard.Dropdown className={dropdown}>
        <DropdownTitle>Drifted views</DropdownTitle>
        <DropdownList ref={listRef}>
          {drifts.map(view => (
            <Link
              key={view.id}
              className={cx('group', item.button, itemLink)}
              to="/project/$projectId/view/$viewId/"
              params={{ projectId, viewId: view.id }}>
              <span className={item.buttonIcon}>
                <ViewIcon view={{ id: view.id, _type: view.type }} />
              </span>
              <styled.span flex="1" minWidth="0" display="flex" flexDirection="column">
                <Truncate className={item.buttonTitle} title={view.title}>{view.title}</Truncate>
                {view.title !== view.id && <Truncate className={item.buttonDescription}>{view.id}</Truncate>}
              </styled.span>
            </Link>
          ))}
        </DropdownList>
      </HoverCard.Dropdown>
    </HoverCard>
  )
}

/**
 * Washed pill. Colours are mixed against the theme's own surface and bright text,
 * so the same rules hold contrast in light and dark
 */
const Badge = styled(Detail, {
  base: {
    cursor: 'default',
    _focusVisible: {
      outline: '[2px solid var(--mantine-color-orange-6)]',
      outlineOffset: '[2px]',
    },
    width: 'fit-content',
    maxWidth: '100%',
    gap: '1.5',
    // keeps the icon on the column of the other detail icons
    marginLeft: '[-10px]',
    paddingY: '[3px]',
    paddingX: '2.5',
    borderRadius: 'pill',
    backgroundColor: '[color-mix(in oklab, var(--mantine-color-orange-6) 13%, var(--colors-surface-default))]',
    boxShadow:
      '[inset 0 0 0 1px color-mix(in oklab, var(--mantine-color-orange-6) 25%, var(--colors-surface-default))]',
  },
})

const BadgeIcon = styled(IconAlertTriangleFilled, {
  base: {
    fill: '[color-mix(in oklab, var(--mantine-color-orange-7) 88%, var(--colors-text-bright))]',
  },
})

const BadgeText = styled('span', {
  base: {
    color: 'text.warning',
    fontWeight: 'medium',
  },
})

const dropdown = css({
  padding: '1.5',
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
})

const DropdownTitle = styled(FieldLabel, {
  base: {
    paddingX: '1.5',
    paddingY: '1',
  },
})

const DropdownList = styled('div', {
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1',
    maxHeight: '[280px]',
    overflowY: 'auto',
  },
})

// rows look like the results of the diagram search
const item = searchOverlay({ size: 'sm' })

const itemLink = css({
  textDecoration: 'none',
  _hover: { textDecoration: 'none' },
})
