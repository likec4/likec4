import { vValidator } from '@hono/valibot-validator'
import * as v from 'valibot'
import { SharePlaygroundReqSchema, sharesKV } from './kv'
import { type SharedPlayground, factory } from './types'

const CheckPincodeSchema = v.strictObject({
  pincode: v.string(),
})

export const apiShareRoute = factory.createApp()
  .get('/:shareId', async c => {
    const kv = sharesKV(c)
    const shareId = c.req.param('shareId')
    const { value, metadata } = await kv.find(shareId)
    await kv.ensureAccess(shareId, metadata.shareOptions)
    return c.json<SharedPlayground>(value)
  })
  .post(
    '/:shareId/check-pincode',
    vValidator('json', CheckPincodeSchema),
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
    vValidator('json', SharePlaygroundReqSchema),
    async c => {
      const payload = c.req.valid('json')
      const kv = sharesKV(c)
      return c.json(await kv.create(payload))
    },
  )
