import { isCI } from 'std-env'
import k from 'tinyrainbow'
import { boxen } from '../logger'
import { getConfigStore } from './conf'

const ONE_MINUTE = 1000 * 60
const ONE_WEEK = ONE_MINUTE * 60 * 24 * 7

/**
 * Once per week print to stdout a message to support us
 */
export function showSupportUsMessage() {
  // Skip on CI
  if (isCI) {
    return
  }
  try {
    const store = getConfigStore()
    const lastTime = store.get('lastSupportUsMessage')

    // Not yet shown? - schedule in 5m
    if (!lastTime) {
      store.set('lastSupportUsMessage', Date.now() - ONE_WEEK + 5 * ONE_MINUTE)
      return
    }

    // One week has not passed
    if (lastTime + ONE_WEEK > Date.now()) {
      return
    }

    // Update last show time
    store.set('lastSupportUsMessage', Date.now())
    boxen(
      [
        k.dim('If you are working in a commercial environment'),
        k.dim('consider supporting the project'),
        '',
        k.dim('How to get more?') + ' ' + k.underline('https://likec4.dev/sponsor/'),
      ].join('\n'),
    )
  } catch {
    // Ignore errors
  }
}
