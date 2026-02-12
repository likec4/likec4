import type { LayoutedModelApi } from '$components/drawio/DrawioContextMenuProvider'
import { Loader } from '@mantine/core'
import { lazy, Suspense } from 'react'

const LazyMonacoEditor = lazy(async () => {
  return await import('./MonacoEditor')
})

export type MonacoEditorProps = {
  setLayoutedModelApi?: (api: LayoutedModelApi | null) => void
}

export function MonacoEditor(props: MonacoEditorProps) {
  return (
    <Suspense fallback={<Loader size={'sm'} />}>
      <LazyMonacoEditor {...props} />
    </Suspense>
  )
}
// export { default as MonacoEditor } from './MonacoEditor'
