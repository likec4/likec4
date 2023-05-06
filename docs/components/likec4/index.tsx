import dynamic from 'next/dynamic'

export const LikeC4View = dynamic({
  loader: () => import('./LikeC4Diagram'),
  loading: () => <div>loading...</div>,
  ssr: false,
})
