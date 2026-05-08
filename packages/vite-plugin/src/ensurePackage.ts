import { nonNullable } from '@likec4/core/utils'
import { loggable } from '@likec4/log'
import spawn from 'nano-spawn'
import process from 'node:process'
import { resolveCommand } from 'package-manager-detector/commands'
import { detect } from 'package-manager-detector/detect'
import { logger as rootLogger } from './logger'
import { k } from './virtuals/_shared'

function isInstalled(name: string): boolean {
  try {
    const resolved = import.meta.resolve(
      name,
      process.cwd(),
    )
    return !!resolved
  } catch (e: any) {
    rootLogger.trace(loggable(e))
    return false
  }
}

/**
 * Ensures a package is installed; prompts to add it if missing.
 * Use current process cwd to resolve package.json
 */
export async function ensurePackage(pkg: string) {
  const logger = rootLogger.getChild('pkg')
  if (isInstalled(pkg)) {
    logger.trace`${pkg} installed`
    return
  }
  logger.warn(
    k.dim(`not found `) + k.green(pkg),
  )

  const pm = nonNullable(
    await detect(),
    () => {
      logger.error`Package manager not detected, install ${pkg} manually`
      process.exit(1)
    },
  )

  const { command, args } = nonNullable(
    resolveCommand(pm.agent, 'add', [pkg]),
    () => {
      logger.error`Install package ${pkg} manually`
      process.exit(1)
    },
  )

  logger.info(
    k.dim(`installing `) + k.green(pkg),
  )

  try {
    await spawn(command, args)
  } catch (e) {
    logger.debug(loggable(e))
    logger.error`Install package ${pkg} manually`
    process.exit(1)
  }
}
