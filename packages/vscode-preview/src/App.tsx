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
    <>
      {screen == 'projects' && <ProjectsScreen />}
      {screen == 'view' && <ViewScreen />}
    </>
  )
}
