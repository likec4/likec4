import { LoadingOverlay } from '@mantine/core'
import { Suspense } from 'react'
import { ErrorMessage } from './QueryErrorBoundary'
import { ProjectsScreen } from './screens/Projects'
import { ViewScreen } from './screens/View'
import { useScreen } from './state'

export function App() {
  const screen = useScreen()

  if (screen !== 'projects' && screen !== 'view') {
    return <ErrorMessage error={'Unknown screen' + screen} />
  }

  return (
    <Suspense fallback={<LoadingOverlay visible zIndex={1000} overlayProps={{ blur: 1, backgroundOpacity: 0.1 }} />}>
      {screen == 'projects' && <ProjectsScreen />}
      {screen == 'view' && <ViewScreen />}
    </Suspense>
  )
}
