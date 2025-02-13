import { loggable } from '@likec4/log'
import ConfigStore from 'conf'
import JSON5 from 'json5'
import latestVersion from 'latest-version'
import spawn from 'nano-spawn'
import { isEmpty, isNullish } from 'remeda'
import { gt as semverGt } from 'semver'
import { isMinimal, nodeENV } from 'std-env'
import k from 'tinyrainbow'
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
    const latest = await latestVersion(name)
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
      logger.info(
        k.dim(`Up to date: `) + ' ' + k.green(version),
      )
    }
  } catch (error) {
    logger.error(loggable(error))
  }
}
