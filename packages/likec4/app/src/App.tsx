import { Provider } from 'jotai'
import { Fragment } from 'react'
import { Sidebar } from './components'
import { ExportPage, IndexPage, ViewPage } from './pages'
import { useRoute } from './router'
import { Theme } from '@radix-ui/themes'

const Routes = () => {
  const r = useRoute()
  return (
    <Theme
      hasBackground={r.route !== 'export'}
      accentColor='indigo'
      radius='small'
      appearance={r.params?.theme}
    >
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
    </Theme>
  )
}

export default function App() {
  return (
    <Provider>
      <Routes />
    </Provider>
  )
}
