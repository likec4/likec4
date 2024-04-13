import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'
import './shadow.css'

import { LikeC4Browser } from './LikeC4Browser'
import { LikeC4View } from './LikeC4View'

customElements.define('likec4-view', LikeC4View)
customElements.define('likec4-browser', LikeC4Browser)
