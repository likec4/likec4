import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'
import { skillsLoader } from 'astro-skills'
import { defineCollection } from 'astro:content'

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  skills: defineCollection({
    loader: skillsLoader({ base: '../../skills' }),
  }),
}
