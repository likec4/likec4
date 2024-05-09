import { LikeC4BrowserModal, LikeC4ViewComponent } from 'likec4/react'
import { type HTMLAttributes, useState } from 'react'
import { type LikeC4ViewId, LikeC4Views } from 'virtual:likec4/views'

type LikeC4ViewProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  viewId: LikeC4ViewId
  interactive?: boolean
  colorScheme?: 'light' | 'dark' | undefined
}

export function LikeC4View({
  viewId,
  interactive = true,
  colorScheme,
  ...props
}: LikeC4ViewProps) {
  const view = LikeC4Views[viewId]

  const [browserViewId, onNavigateTo] = useState(null as LikeC4ViewId | null)

  const browserView = browserViewId ? LikeC4Views[browserViewId] : null

  if (!view) {
    throw new Error(`View with id ${viewId} not found`)
  }

  if (browserViewId && !browserView) {
    throw new Error(`View with id ${browserViewId} not found`)
  }

  return (
    <>
      <LikeC4ViewComponent
        view={view}
        colorScheme={colorScheme}
        onNavigateTo={interactive ? onNavigateTo : undefined}
        {...props}
      />
      {browserView && (
        <LikeC4BrowserModal
          view={browserView}
          colorScheme={colorScheme}
          onNavigateTo={onNavigateTo}
          onClose={() => onNavigateTo(null)}
        />
      )}
    </>
  )
}

export default LikeC4Views
