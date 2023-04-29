import dynamic from 'next/dynamic'

const Playground = dynamic(
  () => import('./playground'),
  {
    loading: () => <div>Loading Playground...</div>,
    ssr: false,
  }
)
export default Playground
