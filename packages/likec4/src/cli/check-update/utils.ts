import { invariant } from '@likec4/core'
import { loggable } from '@likec4/log'
import ky from 'ky'
import spawn from 'nano-spawn'
import { isEmptyish } from 'remeda'
import { gt as semverGt } from 'semver'
import { isCI, isTest, nodeENV } from 'std-env'
import k from 'tinyrainbow'
import type { PackageJson } from 'type-fest'
import { boxen, logger } from '../../logger'
import { getConfigStore, pkg } from '../conf'

const ONE_DAY = 1000 * 60 * 60 * 24

const ENV_CHECK_UPDATE = 'check-update'

export async function notifyAvailableUpdate() {
  if (isCI || isTest || nodeENV === ENV_CHECK_UPDATE) {
    return
  }
  const store = getConfigStore()
  const lastUpdateCheck = store.get('lastUpdateCheck')
  if (!lastUpdateCheck) {
    await checkAvailableUpdate(false)
    return
  }
  const latestVersion = store.get('latestVersion')
  const shouldUpdate = isEmptyish(latestVersion) || isEmptyish(lastUpdateCheck) ||
    (lastUpdateCheck + ONE_DAY < Date.now())
  if (shouldUpdate) {
    try {
      spawn('likec4', ['check-update'], {
        stdio: 'ignore',
        timeout: 5_000,
        preferLocal: true,
        detached: true,
        env: {
          'NODE_ENV': ENV_CHECK_UPDATE,
        },
      }).catch(() => {
        // ignore error
      })
    } catch {
      // ignore error
    }
  }
  if (latestVersion && semverGt(latestVersion, pkg.version)) {
    boxen([
      `Update available: `,
      k.dim(pkg.version),
      k.reset(' → '),
      k.green(latestVersion),
    ].join(''))
  }
}

/** Fetches latest version from npm, stores in conf; optionally reports up-to-date. */
export async function checkAvailableUpdate(reportUpToDate = true) {
  try {
    const store = getConfigStore()
    store.set({
      lastUpdateCheck: Date.now(),
    })
    const latest = await fetchLatestVersion()
    invariant(latest, 'No version found in latest npm')
    store.set({
      lastUpdateCheck: Date.now(),
      latestVersion: latest,
    })
    if (semverGt(latest, pkg.version)) {
      boxen([
        `Update available: `,
        k.dim(pkg.version),
        k.reset(' → '),
        k.green(latest),
      ].join(''))
    } else if (reportUpToDate) {
      boxen(k.dim(`Up to date: `) + ' ' + k.green(pkg.version))
    }
  } catch (error) {
    logger.warning(loggable(error))
  }
}

async function fetchLatestVersion() {
  const headers = {
    accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
  }
  let latest = await ky('https://registry.npmjs.org/likec4/latest', {
    headers,
    timeout: 5_000,
    keepalive: true,
  }).json<PackageJson>()
  return latest.version
}
