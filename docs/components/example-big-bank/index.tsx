import dynamic from 'next/dynamic'
import type { LikeC4ViewId } from './generated'
import styles from './index.module.css'

const Embedded = dynamic({
  loader: () => import('./generated').then(m => m.Embedded),
  loading: () => <div>rendering...</div>,
  ssr: false
})

export const ExampleLikeC4View = ({
  animate,
  viewId,
  noBrowser = false
}: {
  animate?: boolean | undefined
  viewId: LikeC4ViewId
  noBrowser?: boolean
}) => (
  <div className={styles.likec4embedded}>
    <Embedded animate={animate} viewId={viewId} noBrowser={noBrowser} />
  </div>
)
