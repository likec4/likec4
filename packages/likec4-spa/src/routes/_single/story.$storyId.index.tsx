import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { loadModel } from 'likec4:model'

export const Route = createFileRoute('/_single/story/$storyId/')({
  beforeLoad: async ({ params, context }) => {
    const likec4model = await loadModel(context.projectId)
    const model = likec4model.$likec4model.get()
    const story = model.findStory(params.storyId as any)
    const firstScene = story?.scenes[0]
    if (!firstScene) {
      throw notFound()
    }
    throw redirect({
      to: '/story/$storyId/view/$viewId/',
      params: { ...params, viewId: firstScene.view },
    })
  },
})
