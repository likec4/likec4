import { nonexhaustive } from '@likec4/core'
import { Theme } from '@radix-ui/themes'
import { Provider } from 'jotai'
import { Fragment, useDeferredValue } from 'react'
import { isNil } from 'remeda'
import { Sidebar } from './components'
import { EmbedPage, ExportPage, IndexPage, ViewPage } from './pages'
import { useRoute } from './router'

const Routes = () => {
  const r = useDeferredValue(useRoute())

  const theme = r.params?.theme

  const page = () => {
    switch (r.route) {
      case 'view':
        return <ViewPage viewId={r.params.viewId} viewMode={r.params.mode} showUI={r.showUI} />
      case 'export':
        return <ExportPage viewId={r.params.viewId} padding={r.params.padding} />

      case 'embed':
        return (
          <EmbedPage
            viewId={r.params.viewId}
            padding={r.params.padding}
            transparentBg={isNil(r.params.theme)}
          />
        )
      case 'index':
        return <IndexPage />
      default:
        nonexhaustive(r)
    }
  }

  return (
    <Theme
      hasBackground={!!theme}
      accentColor='indigo'
      radius='small'
      appearance={theme ?? 'inherit'}
    >
      {page()}
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
