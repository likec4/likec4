import dynamic from 'next/dynamic'

export const ExampleLikeC4View = dynamic({
  loader: () => import('./generated').then(m => m.Embedded),
  loading: () => <div>rendering...</div>,
  ssr: false
})
