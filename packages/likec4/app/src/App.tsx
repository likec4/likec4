import { nonexhaustive } from '@likec4/core'
import { Box, Theme } from '@radix-ui/themes'
import { Provider } from 'jotai'
import { Fragment, useDeferredValue } from 'react'
import { isNil } from 'remeda'
import { Sidebar } from './components'
import { EmbedPage, ExportPage, IndexPage, ViewPage } from './pages'
import { useRoute } from './router'

const Routes = () => {
  const r = useDeferredValue(useRoute())

  const theme = r.params?.theme
  let page: JSX.Element | null = null

  switch (r.route) {
    case 'view': {
      page = (
        <ViewPage key='view' viewId={r.params.viewId} viewMode={r.params.mode} showUI={r.showUI} />
      )
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
          transparentBg={isNil(r.params.theme)}
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
    <Theme
      hasBackground={!!theme}
      accentColor='indigo'
      radius='small'
      appearance={theme ?? 'inherit'}
    >
      {page}
      <Fragment key='ui'>{r.showUI && <Sidebar />}</Fragment>
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
