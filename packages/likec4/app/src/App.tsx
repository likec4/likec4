import { Provider } from 'jotai'
import { useAtomsDevtools } from 'jotai-devtools'
import type { PropsWithChildren } from 'react'
import { Fragment } from 'react'
import { Sidebar } from './components'
import { ThemeButton } from './components/ThemeButton'
import { ExportPage, IndexPage, ViewPage } from './pages'
import { useRoute } from './router'

const Routes = () => {
  const r = useRoute()
  return (
    <>
      {r.route === 'index' && <IndexPage key='index' />}
      {r.route === 'view' && <ViewPage key='view' viewId={r.params.viewId} showUI={r.showUI} />}
      {r.route === 'export' && <ExportPage key='export' viewId={r.params.viewId} />}
      {r.showUI && (
        <Fragment key='ui'>
          <Sidebar />
          <ThemeButton />
        </Fragment>
      )}
    </>
  )
}

const AtomsDevTools = ({ children }: PropsWithChildren) => {
  useAtomsDevtools('demo')
  return <>{children}</>
}

export default function App() {
  return (
    <Provider>
      <AtomsDevTools>
        <Routes />
      </AtomsDevTools>
    </Provider>
  )
}
