import { createSafeContext } from '@mantine/core'

export const [ReducedGraphicsContext, useIsReducedGraphics] = createSafeContext<boolean>(
  'ReducedGraphicsContext is not provided',
)
