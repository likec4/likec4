import type { FC, PropsWithChildren } from 'hono/jsx'
import { pick } from 'remeda'
import { factory } from './types'

const Layout: FC<PropsWithChildren> = (props) => {
  return (
    <html>
      <body>{props.children}</body>
    </html>
  )
}

const Top: FC<{ records: Array<{ key: string; expiration: number | null; value: unknown }> }> = ({ records }) => {
  return (
    <Layout>
      <h1>Hello Hono!</h1>
      <table border={1}>
        {records.map((record) => (
          <tr>
            <td valign="top" style={{ paddingRight: 10 }}>
              {record.key}
              <br />
              <a href={`/viewkv/${record.key}/delete`}>delete</a>
              {record.key.startsWith('share:') && (
                <>
                  <br />
                  <a href={`/share/${record.key.substring(6)}`} target="_blank">view</a>
                </>
              )}
            </td>
            <td valign="top" style={{ paddingRight: 10 }}>{record.expiration ?? '-'}</td>
            <td valign="top">
              <code style={{ whiteSpace: 'pre' }}>
                {JSON.stringify(record.value, null, 2)}
              </code>
            </td>
          </tr>
        ))}
      </table>
    </Layout>
  )
}

export const viewKv = factory.createApp()
  .use('*', async (c, next) => {
    // TODO allow Denis (during development)
    if (c.get('session').get('userId') !== 824903) {
      return c.text('Unauthorized', 401)
    }
    return await next()
  })
  .get('/', async c => {
    let cursor = await c.env.KV.list()
    const keys = cursor.keys.map(pick(['name', 'expiration']))
    while (cursor.list_complete === false) {
      cursor = await c.env.KV.list({ cursor: cursor.cursor })
      keys.push(...cursor.keys.map(pick(['name', 'expiration'])))
    }
    const records = [] as Array<{ key: string; expiration: number | null; value: unknown }>
    for (const key of keys) {
      const value = await c.env.KV.get(key.name, 'json')
      records.push({ key: key.name, expiration: key.expiration ?? null, value })
    }

    return c.html(<Top records={records} />)
  })
  .get('/:key/delete', async c => {
    await c.env.KV.delete(c.req.param('key'))
    return c.redirect('/viewkv')
  })
