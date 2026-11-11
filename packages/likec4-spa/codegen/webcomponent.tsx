// Replaced with likec4/react when bundled
import { defineLikeC4Webcomponent } from '@likec4/diagram'
import { ComponentName } from 'likec4:app-config'
import { LikeC4View } from 'likec4:react'
import { projectId } from 'likec4:single-project'

defineLikeC4Webcomponent(
  ComponentName.View,
  LikeC4View,
  projectId,
)
