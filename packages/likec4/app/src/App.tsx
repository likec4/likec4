import { Provider } from 'jotai'
import { Fragment } from 'react'
import { Sidebar } from './components'
import { ExportPage, IndexPage, EmbedPage, ViewPage } from './pages'
import { useRoute } from './router'
import { Theme } from '@radix-ui/themes'
import { nonexhaustive } from '@likec4/core'

const Routes = () => {
  const r = useRoute()

  const theme = r.params?.theme
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
      page = (
        <EmbedPage
          key='embed'
          viewId={r.params.viewId}
          padding={r.params.padding}
          transparentBg={!theme}
        />
      )
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
    <Theme hasBackground={!!theme} accentColor='indigo' radius='small' appearance={theme}>
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
