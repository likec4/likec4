import { Loader } from '@mantine/core'
// import { initLocaleLoader } from 'monaco-editor-wrapper/vscode/locale'
import { lazy, Suspense } from 'react'

const LazyMonacoEditor = lazy(async () => {
  // await initLocaleLoader()
  return await import('./MonacoEditor')
})

export function MonacoEditor() {
  return (
    <Suspense fallback={<Loader size={'sm'} />}>
      <LazyMonacoEditor />
    </Suspense>
  )
}
