import { Loader } from '@mantine/core'
import { lazy, Suspense } from 'react'
import type { MonacoEditorProps } from './MonacoEditor'

export type { MonacoEditorProps } from './MonacoEditor'

const LazyMonacoEditor = lazy(async () => {
  return await import('./MonacoEditor')
})

/**
 * Monaco-based editor for LikeC4 source with LSP. Uses Suspense and lazy-loaded LazyMonacoEditor.
 * @param props - Editor props (e.g. setLayoutedModelApi for Draw.io round-trip).
 * @returns Wrapped editor element or fallback Loader.
 */
export function MonacoEditor(props: MonacoEditorProps) {
  return (
    <Suspense fallback={<Loader size={'sm'} />}>
      <LazyMonacoEditor {...props} />
    </Suspense>
  )
}
