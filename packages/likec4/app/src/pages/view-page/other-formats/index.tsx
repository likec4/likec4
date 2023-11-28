import { nonexhaustive } from '@likec4/core'
import type { ViewMode } from '../../../router'
import ViewAsD2 from './ViewAsD2'
import ViewAsDot from './ViewAsDot'
import ViewAsMmd from './ViewAsMmd'

type Props = {
  viewMode: Exclude<ViewMode, 'react'>
  viewId: string
}
export default function ViewDiagramInOtherFormats({ viewId, viewMode }: Props) {
  switch (viewMode) {
    case 'dot':
      return <ViewAsDot viewId={viewId} />
    case 'd2':
      return <ViewAsD2 viewId={viewId} />
    case 'mmd':
      return <ViewAsMmd viewId={viewId} />
    default:
      nonexhaustive(viewMode)
  }
}
