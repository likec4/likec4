import { expect, test } from 'vitest'
import { isCI } from 'std-env'
import playgroundConfig from '../e2e/playwright.playground.config'
import config from '../e2e/playwright.config'

function requireSingleWebServer(
  webServer: typeof config.webServer | typeof playgroundConfig.webServer,
) {
  if (!webServer || Array.isArray(webServer)) {
    throw new Error('Expected a single webServer config')
  }
  return webServer
}

test('main playwright config has expected values', () => {
  expect(config.testDir).toBe('tests')
  expect(config.testIgnore).toEqual(['**/drawio-playground.spec.ts', '**/docs-smoke.spec.ts'])
  expect(config.timeout).toBe(15000)
  expect(config.retries).toBe(isCI ? 1 : 0)
  expect(config.reporter).toEqual(isCI ? [['github'], ['list'], ['html']] : 'html')

  const ws = requireSingleWebServer(config.webServer)
  expect(ws.command).toBe('pnpm likec4 start --verbose --no-react-hmr --no-build-webcomponent')
  expect(ws.port).toBe(5173)
  expect(ws.timeout).toBe(60000)
})

test('playground playwright config has expected webServer timeout', () => {
  const ws = requireSingleWebServer(playgroundConfig.webServer)
  expect(ws.port).toBe(5174)
  expect(ws.timeout).toBe(60000)
})
