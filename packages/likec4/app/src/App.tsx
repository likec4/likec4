import { Provider } from 'jotai'
// import { useAtomsDevtools } from 'jotai-devtools'
import { Fragment } from 'react'
import { Sidebar } from './components'
import { ExportPage, IndexPage, ViewPage } from './pages'
import { useRoute } from './router'

const Routes = () => {
  const r = useRoute()
  return (
    <>
      {r.route === 'index' && <IndexPage key='index' />}
      {r.route === 'view' && <ViewPage key='view' viewId={r.params.viewId} showUI={r.showUI} />}
      {r.route === 'export' && (
        <ExportPage key='export' viewId={r.params.viewId} padding={r.params.padding} />
      )}
      {r.showUI && (
        <Fragment key='ui'>
          <Sidebar />
        </Fragment>
      )}
    </>
  )
}

// const AtomsDevTools = import.meta.env.DEV ? ({ children }: PropsWithChildren) => {
//   useAtomsDevtools('demo')
//   return <>{children}</>
// } : Fragment

export default function App() {
  return (
    <Provider>
      <Routes />
    </Provider>
  )
}
