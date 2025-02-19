import { invariant } from '@likec4/core'
import { loggable } from '@likec4/log'
import ConfigStore from 'conf'
import JSON5 from 'json5'
import ky from 'ky'
import spawn from 'nano-spawn'
import { isEmpty, isNullish } from 'remeda'
import { gt as semverGt } from 'semver'
import { isMinimal, nodeENV } from 'std-env'
import k from 'tinyrainbow'
import type { PackageJson } from 'type-fest'
import { name, version } from '../../../package.json' with { type: 'json' }
import { boxen, logger } from '../../logger'

type StoredConfiguration = {
  lastUpdateCheck?: number // timestamp
  latestVersion?: string
}
export const conf = new ConfigStore<StoredConfiguration>({
  projectName: name,
  serialize: value => JSON5.stringify(value, null, 2),
  deserialize: value => JSON5.parse(value),
})

const ONE_DAY = 1000 * 60 * 60 * 24

const ENV_CHECK_UPDATE = 'check-update'

export function notifyAvailableUpdate() {
  if (isMinimal || nodeENV === ENV_CHECK_UPDATE) {
    return
  }
  const lastUpdateCheck = conf.get('lastUpdateCheck')
  const latestVersion = conf.get('latestVersion')
  const shouldUpdate = isEmpty(latestVersion) || isNullish(lastUpdateCheck) || (lastUpdateCheck + ONE_DAY < Date.now())
  if (shouldUpdate) {
    spawn('likec4', ['check-update'], {
      stdio: 'ignore',
      preferLocal: true,
      detached: true,
      env: {
        'NODE_ENV': ENV_CHECK_UPDATE,
      },
    }).catch(() => {
      // ignore output
    })
  }
  if (latestVersion && semverGt(latestVersion, version)) {
    boxen([
      `Update available: `,
      k.dim(version),
      k.reset(' → '),
      k.green(latestVersion),
    ].join(''))
  }
}

export async function checkAvailableUpdate() {
  try {
    const latest = await fetchLatestVersion()
    invariant(latest, 'No version found in latest npm')
    conf.set({
      lastUpdateCheck: Date.now(),
      latestVersion: latest,
    })
    if (semverGt(latest, version)) {
      boxen([
        `Update available: `,
        k.dim(version),
        k.reset(' → '),
        k.green(latest),
      ].join(''))
    } else {
      boxen(k.dim(`Up to date: `) + ' ' + k.green(version))
    }
  } catch (error) {
    logger.error(loggable(error))
  }
}

async function fetchLatestVersion() {
  const headers = {
    accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
  }
  let latest = await ky('https://registry.npmjs.org/likec4/latest', { headers, keepalive: true }).json<PackageJson>()
  return latest.version
}
