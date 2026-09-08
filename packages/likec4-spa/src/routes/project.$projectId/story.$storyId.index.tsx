import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { loadModel } from 'likec4:model'

export const Route = createFileRoute('/project/$projectId/story/$storyId/')({
  beforeLoad: async ({ params }) => {
    const likec4model = await loadModel(params.projectId as any)
    const model = likec4model.$likec4model.get()
    const story = model.findStory(params.storyId as any)
    const firstScene = story?.scenes[0]
    if (!firstScene) {
      throw notFound()
    }
    throw redirect({
      to: '/project/$projectId/story/$storyId/view/$viewId/',
      params: { ...params, viewId: firstScene.view },
    })
  },
})
