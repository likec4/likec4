import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'
import './shadow.css'

import { ComponentName } from './const.js'
import { LikeC4Browser } from './LikeC4Browser'
import { LikeC4View } from './LikeC4View'

customElements.define(ComponentName.View, LikeC4View)
customElements.define(ComponentName.Browser, LikeC4Browser)
