import { githubAuth } from '@hono/oauth-providers/github'
import { invariant, nonNullable } from '@likec4/core'
import { CookieStore, sessionMiddleware } from 'hono-sessions'
import { type GithubLogin, type HonoContext, type UserSession, factory } from './types'

export function readUserSession(c: HonoContext): UserSession | null {
  const session = c.get('session')
  if (!session.sessionValid()) {
    return null
  }
  const userId = session.get('userId'),
    login = session.get('login'),
    name = session.get('name'),
    email = session.get('email') ?? null,
    avatarUrl = session.get('avatarUrl') ?? null
  if (!userId && !login) {
    return null
  }
  try {
    invariant(userId, 'User ID is required')
    invariant(login, 'User login is required')
    invariant(name, 'Name is required')
    session.updateAccess()
    return {
      userId,
      login,
      name,
      email,
      avatarUrl,
    }
  } catch (e) {
    console.error(`Invalid session ${e}`, {
      userId,
      login,
      name,
      email,
    })
    return null
  }
}

export const cookieSessionMiddleware = factory.createMiddleware(async (c, next) => {
  const store = new CookieStore()

  const m = sessionMiddleware({
    store,
    sessionCookieName: 'lkc4.plgrnd',
    encryptionKey: c.env.SESSION_ENCRYPTION_KEY,
    // 1 month in seconds
    expireAfterSeconds: 2_592_000,
    cookieOptions: {
      sameSite: 'Lax',
      path: '/',
      httpOnly: true,
    },
  })

  return m(c, next)
})

export const auth = factory.createApp()
  .use('/github', githubAuth({}))
  .get('/github', c => {
    const session = c.get('session')
    const user = c.get('user-github')
    if (!user) {
      console.warn('auth callback without user')
      return c.text('Unauthorized', 401)
    }
    console.info(`authenticated with github @${user.login}`)

    session.set('userId', nonNullable(user.id, 'User ID is required'))
    invariant(user.login, 'User login is required')
    session.set('login', user.login as GithubLogin)
    if (user.avatar_url) {
      session.set('avatarUrl', user.avatar_url)
    }
    if (user.email) {
      session.set('email', user.email)
    }
    session.set('name', user.name ?? user.login)

    return c.redirect('/redirect-after-auth')
  })
  .get('/me', c => {
    return c.json({ session: readUserSession(c) })
  })
  .get('/forget-me', c => {
    c.get('session').deleteSession()
    return c.redirect(c.req.query('redirect_to') ?? '/')
  })
