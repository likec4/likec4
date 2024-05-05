import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'

import { ComponentName } from '../src/const'
import { LikeC4Browser } from './LikeC4Browser'
import { LikeC4View } from './LikeC4View'

import './shadow.css'

customElements.define(ComponentName.View, LikeC4View)
customElements.define(ComponentName.Browser, LikeC4Browser)
