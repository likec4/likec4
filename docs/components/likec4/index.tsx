
import type { LikeC4ViewProps } from './generated'
import dynamic from 'next/dynamic'
import css from './index.module.css'

const NoSSRLikeC4View = dynamic(
  () => import('./generated').then(m => m.LikeC4View),
  {
    loading: () => <div>loading...</div>,
    ssr: false,
  }
)

export function LikeC4View(props: LikeC4ViewProps) {
  return <NoSSRLikeC4View
    padding={10}
    className={css.view}
    {...props}
  />
}
