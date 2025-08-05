import z from 'zod'

export const locationSchema = z.object({
  uri: z.string(),
  range: z.object({
    start: z.object({
      line: z.number(),
      character: z.number(),
    }),
    end: z.object({
      line: z.number(),
      character: z.number(),
    }),
  }),
})
