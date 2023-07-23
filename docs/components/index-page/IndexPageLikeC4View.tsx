import { LikeC4Diagram, type LikeC4DiagramProps } from '../likec4'
import { LikeC4ViewsData } from './generated'

type IndexPageLikeC4ViewProps = Omit<LikeC4DiagramProps<LikeC4ViewsData>, 'views'>

export default function IndexPageLikeC4View({ viewId, ...props }: IndexPageLikeC4ViewProps) {
  return <LikeC4Diagram views={LikeC4ViewsData} viewId={viewId} {...props} />
}
