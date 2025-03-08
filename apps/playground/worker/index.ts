import { Hono } from 'hono'
import {
  Session,
} from 'hono-sessions'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'
import { proxy } from 'hono/proxy'
import { apiShareRoute } from './api.share'
import { auth, cookieSessionMiddleware } from './auth'
import { sharesKV } from './kv'
import { factory } from './types'
import { viewKv } from './viewkv'

export type SessionData = {
  login: string
  userId: number
  name: string
  email: string | null
  avatarUrl: string | null
}

type HonoEnv = {
  Variables: {
    session: Session<SessionData>
    session_key_rotation: boolean
  }
  Bindings: Env
}

const api = factory.createApp()
  .use('*', cookieSessionMiddleware)
  .use(
    bodyLimit({
      maxSize: 10 * 1024 * 1024, // 10MB
      onError: (c) => {
        return c.text('Max 10MB', 413)
      },
    }),
  )
  .route('/auth', auth)
  .route('/viewkv', viewKv)
  .route('/api/share', apiShareRoute)
  .get('/share/:shareId/enter-pincode', async c => {
    const kv = sharesKV(c)
    const { shareOptions } = await kv.readMetadata(c.req.param('shareId'))
    if (shareOptions.access !== 'pincode') {
      return c.redirect(`/share/${c.req.param('shareId')}/view/index/`)
    }

    const lastPincode = c.get('session').get('pincode')
    if (lastPincode === shareOptions.pincode) {
      return c.redirect(`/share/${c.req.param('shareId')}/view/index/`)
    }

    return proxy(c.req.raw, {
      fetcher: c.env.ASSETS,
    })
  })
  .get('/share/:shareId/not-found', async c => {
    return proxy(c.req.raw, {
      fetcher: c.env.ASSETS,
    })
  })
  .get('/share/:shareId/*', async c => {
    const kv = sharesKV(c)
    await kv.ensureAccess(c.req.param('shareId'))
    return proxy(c.req.raw, {
      fetcher: c.env.ASSETS,
    })
  })
  .onError((error, c) => {
    console.error(`Failed ${c.req.url} ${error.message}${error.stack ? '\n' + error.stack : ''}`)
    if (error instanceof HTTPException) {
      // Get the custom response
      return error.getResponse()
    }
    return c.text('Internal Server Error', { status: 500 })
  })

export type ApiType = typeof api

const ByHono = [
  '/api',
  '/auth',
  '/viewkv',
  '/share',
]
export default {
  fetch(request, env) {
    const url = new URL(request.url)
    if (ByHono.some(path => url.pathname.startsWith(path))) {
      return api.fetch(request, env)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
