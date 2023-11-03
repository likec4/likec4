import { Provider } from 'jotai'
import { Fragment } from 'react'
import { Sidebar } from './components'
import { ExportPage, IndexPage, EmbedPage, ViewPage } from './pages'
import { useRoute } from './router'
import { Theme } from '@radix-ui/themes'
import { nonexhaustive } from '@likec4/core'

const Routes = () => {
  const r = useRoute()

  let page: JSX.Element | null = null
  switch (r.route) {
    case 'view': {
      page = <ViewPage key='view' viewId={r.params.viewId} showUI={r.showUI} />
      break
    }
    case 'export': {
      page = <ExportPage key='export' viewId={r.params.viewId} padding={r.params.padding} />
      break
    }
    case 'embed': {
      page = <EmbedPage key='embed' viewId={r.params.viewId} padding={r.params.padding} />
      break
    }
    case 'index': {
      page = <IndexPage key='index' />
      break
    }
    default:
      nonexhaustive(r)
  }

  return (
    <Theme
      hasBackground={r.route !== 'export'}
      accentColor='indigo'
      radius='small'
      appearance={r.route !== 'export' ? r.params?.theme ?? 'inherit' : undefined}
    >
      {page}
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
