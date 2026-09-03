import { createFileRoute } from '@tanstack/react-router'
import { StoryReact } from '../../pages/StoryReact'

export const Route = createFileRoute('/_single/story/$storyId/view/$viewId')({
  component: StoryReact,
})
