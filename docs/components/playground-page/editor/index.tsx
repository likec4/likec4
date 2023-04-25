import dynamic from 'next/dynamic'

const CodeEditor = dynamic(
  () => import('./ReactMonacoEditor'),
  {
    loading: () => <div>loading...</div>,
    ssr: false,
  }
)
export default CodeEditor
