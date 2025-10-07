import { zValidator } from '@hono/zod-validator'
import { defaultTheme } from '@likec4/core/styles'
import type { TagSpecification } from '@likec4/core/types'
import { isArray, mapToObj } from 'remeda'
import * as z from 'zod/v4'
import { SharePlaygroundReqSchema, sharesKV } from './kv'
import { type SharedPlayground, factory } from './types'

const CheckPincodeSchema = z.object({
  pincode: z.string(),
})

export const apiShareRoute = factory.createApp()
  .get('/my', async c => {
    const kv = sharesKV(c)
    return c.json(await kv.myshares())
  })
  .get('/:shareId', async c => {
    const kv = sharesKV(c)
    const shareId = c.req.param('shareId')
    const { value, metadata } = await kv.find(shareId)
    await kv.ensureAccess(shareId, metadata.shareOptions)

    // TODO: temporary solution for backwards compatibility
    const tagSpecs = value.model.specification.tags as Record<string, TagSpecification> | string[] | undefined
    if (isArray(tagSpecs)) {
      value.model.specification.tags = mapToObj(
        tagSpecs,
        tag => [tag, { color: defaultTheme.colors.muted.elements.fill }],
      )
    }

    return c.json<SharedPlayground>(value)
  })
  .post(
    '/:shareId/check-pincode',
    zValidator('json', CheckPincodeSchema, (result, c) => {
      if (result.success === false) {
        console.warn('check-pincode validation failed', z.prettifyError(result.error))
        return c.json(z.flattenError(result.error), 400) as never
      }
    }),
    async c => {
      const kv = sharesKV(c)
      const shareId = c.req.param('shareId')
      console.log(`check pin for share ${shareId}`)
      const { shareOptions } = await kv.readMetadata(shareId)
      const { pincode } = c.req.valid('json')
      if (shareOptions.access !== 'pincode') {
        return c.json({ valid: true as const })
      }
      if (shareOptions.access === 'pincode' && shareOptions.pincode === pincode) {
        c.get('session').set('pincode', pincode)
        return c.json({ valid: true as const })
      }
      return c.text('Invalid pincode', 403) as never
    },
  )
  .post(
    '/',
    zValidator('json', SharePlaygroundReqSchema, (result, c) => {
      if (result.success === false) {
        console.warn('create share validation failed', z.prettifyError(result.error))
        return c.json(z.flattenError(result.error), 400) as never
      }
    }),
    async c => {
      const payload = c.req.valid('json')
      const kv = sharesKV(c)
      return c.json(await kv.create(payload))
    },
  )
