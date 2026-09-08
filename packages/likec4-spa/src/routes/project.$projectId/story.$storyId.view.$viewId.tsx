import { createFileRoute } from '@tanstack/react-router'
import { StoryReact } from '../../pages/StoryReact'

export const Route = createFileRoute('/project/$projectId/story/$storyId/view/$viewId')({
  component: StoryReact,
})
