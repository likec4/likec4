import type { DependencyInstaller, DependencyInstallResult } from './types'

/**
 * Installer of hosts that cannot install git dependencies (browser, tests, hosts without git).
 * Default when the host provides no installer.
 */
export class UnsupportedDependencyInstaller implements DependencyInstaller {
  readonly supported = false

  install(): Promise<DependencyInstallResult> {
    return Promise.resolve({ status: 'unsupported' })
  }
}
