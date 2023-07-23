import dynamic from 'next/dynamic'

export const ExampleLikeC4View = dynamic({
  loader: () => import('./ExampleLikeC4View'),
  loading: () => <div>rendering...</div>,
  ssr: false
})
