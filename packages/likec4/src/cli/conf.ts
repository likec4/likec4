import ConfigStore from 'conf'
import { once } from 'remeda'
import { name, version } from '../../package.json' with { type: 'json' }
import { logger } from '../logger'

export type StoredConfiguration = {
  // Last time update check was performed
  lastUpdateCheck?: number
  // Latest version found during last update check
  latestVersion?: string

  // Last time support us message was shown
  lastSupportUsMessage?: number
}

export const pkg = {
  name,
  version,
}

/** Persistent CLI Store */
export const getConfigStore = once(() => {
  try {
    return new ConfigStore<StoredConfiguration>({
      projectName: name,
      clearInvalidConfig: true,
      watch: false,
    })
  } catch (error) {
    logger.debug('Failed to create config store', { error })
    // ConfigStore constructor may throw if there are permission issues or other problems
    // In such cases, return undefined to indicate that the store could not be created
    return undefined
  }
})
