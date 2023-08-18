import { LikeC4 } from 'src/likec4'
import { LikeC4Views, type LikeC4ViewId } from './likec4.generated'

export const { isViewId, Diagram, Responsive, Embedded, Browser } =
  LikeC4.create<LikeC4ViewId>(LikeC4Views)

export type DiagramProps = LikeC4.DiagramProps<LikeC4ViewId>
export type ResponsiveProps = LikeC4.ResponsiveProps<LikeC4ViewId>
export type EmbeddedProps = LikeC4.EmbeddedProps<LikeC4ViewId>
export type BrowserProps = LikeC4.BrowserProps<LikeC4ViewId>

export type { LikeC4ViewId, DiagramNode, DiagramApi } from './likec4.generated'
