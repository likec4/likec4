import ConfigStore from 'conf'
import { once } from 'remeda'
import { name, version } from '../../package.json' with { type: 'json' }

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
export const getConfigStore = once(() =>
  new ConfigStore<StoredConfiguration>({
    projectName: name,
    clearInvalidConfig: true,
  })
)
