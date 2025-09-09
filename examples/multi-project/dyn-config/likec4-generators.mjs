import { defineGenerators } from 'likec4/config'

export default defineGenerators({
  hello: async ({ likec4model, ctx }) => {
    for (const view of likec4model.views()) {
      const { folder } = ctx.locate(view)
      await ctx.write({
        path: [folder, 'views', `${view.id}.json`],
        content: JSON.stringify(view.$view),
      })
    }
  },
})
