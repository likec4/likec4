import { EmbeddedDiagram } from '../src/components'
import { LikeC4Views } from './likec4/likec4.generated'

export default function DevEmbeded() {
  return (
    <div className='dev-app'>
      <EmbeddedDiagram views={LikeC4Views} viewId='index' />
    </div>
  )
}
