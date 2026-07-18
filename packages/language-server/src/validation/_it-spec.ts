import { testFileScope as test } from '../test'

export const it = test.extend('validateAll', async ({ t }) => {
  return async () => {
    return await t.validateAll()
  }
})
