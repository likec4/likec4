import { githubAuth } from '@hono/oauth-providers/github'
import { invariant, nonNullable } from '@likec4/core'
import { CookieStore, sessionMiddleware } from 'hono-sessions'
import { type GithubLogin, type HonoContext, type UserSession, factory } from './types'

export function readUserSession(c: HonoContext): UserSession | null {
  const session = c.var.session
  if (!session.sessionValid()) {
    return null
  }
  const userId = session.get('userId'),
    login = session.get('login')
  if (!userId && !login) {
    return null
  }
  const name = session.get('name') ?? login,
    email = session.get('email') ?? null,
    avatarUrl = session.get('avatarUrl') ?? null
  try {
    invariant(userId, 'user id is missing in session')
    invariant(login, 'login is missing in session')
    invariant(name, 'name is missing in session')
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

  let encryptionKey = c.env.SESSION_ENCRYPTION_KEY
  if (!encryptionKey) {
    console.warn('secret SESSION_ENCRYPTION_KEY is not set, using default dev key')
    encryptionKey = 'VFRAdSem81cuALVeOMC4PJyLXf30tckV'
  }

  return await sessionMiddleware({
    store,
    sessionCookieName: 'lkc4.plgrnd',
    encryptionKey,
    // 1 month in seconds
    expireAfterSeconds: 2_592_000,
    cookieOptions: {
      sameSite: 'Lax',
      path: '/',
      httpOnly: true,
      secure: !import.meta.env.DEV,
    },
  })(c, next)
})

const githubAuthMiddleware = factory.createMiddleware(async (c, next) => {
  // const [client_id, client_secret] = await Promise.all([
  //   c.env.OAUTH_GITHUB_ID.get(),
  //   c.env.OAUTH_GITHUB_SECRET.get(),
  // ])
  return await githubAuth({
    client_id: c.env.OAUTH_GITHUB_ID,
    client_secret: c.env.OAUTH_GITHUB_SECRET,
    oauthApp: true,
    scope: ['user:email'],
  })(c, next)
})

export const auth = factory.createApp()
  .use('/github', githubAuthMiddleware)
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
    const session = readUserSession(c)
    return c.json({
      // Exclude email from response
      session: session
        ? {
          userId: session.userId,
          login: session.login,
          name: session.name,
          avatarUrl: session.avatarUrl,
        }
        : null,
    })
  })
  .get('/forget-me', c => {
    c.get('session').deleteSession()
    return c.redirect(c.req.query('redirect_to') ?? '/')
  })
