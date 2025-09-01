const config = {
  name: 'dyn-config',
  title: 'Dynamic Config',
  generators: {
    hello: async ({ likec4model, ctx }) => {
      for (const view of likec4model.views()) {
        const { folder } = ctx.locate(view)
        await ctx.write({
          path: [folder, 'views', `${view.id}.json`],
          content: JSON.stringify(view.$view),
        })
      }
    },
  },
}

export default config
