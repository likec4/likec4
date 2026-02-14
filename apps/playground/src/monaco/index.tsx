import { Loader } from '@mantine/core'
import { lazy, Suspense } from 'react'
import type { MonacoEditorProps } from './MonacoEditor'

export type { MonacoEditorProps } from './MonacoEditor'

const LazyMonacoEditor = lazy(async () => {
  return await import('./MonacoEditor')
})

export function MonacoEditor(props: MonacoEditorProps) {
  return (
    <Suspense fallback={<Loader size={'sm'} />}>
      <LazyMonacoEditor {...props} />
    </Suspense>
  )
}
