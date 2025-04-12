import { loggable } from '@likec4/log'
import spawn from 'nano-spawn'
import module from 'node:module'
import { resolveCommand } from 'package-manager-detector/commands'
import { detect } from 'package-manager-detector/detect'
import { logger } from '../logger'

function isInstalled(name: string): boolean {
  try {
    const p = module.createRequire(import.meta.url).resolve(name)
    return !!p
  } catch (e: any) {
    logger.debug(loggable(e))
    return false
  }
}

export async function ensureReact() {
  if (isInstalled('react') && isInstalled('react-dom')) {
    logger.debug('react already installed')
    return
  }
  logger.debug('react not installed')

  const pm = await detect()
  if (!pm) {
    logger.error`Package manager not detected, please install dependencies manually: ${'react'} ${'react-dom'}`
    process.exit(1)
  }

  const cmd = resolveCommand(pm.agent, 'add', ['react', 'react-dom'])
  if (!cmd) {
    logger.error`Please install dependencies manually: ${'react'} ${'react-dom'}`
    process.exit(1)
  }

  try {
    await spawn(cmd.command, cmd.args, { stdio: 'inherit' })
  } catch (e) {
    logger.debug(loggable(e))
    logger.error`Please install dependencies manually: ${'react'} ${'react-dom'}`
    process.exit(1)
  }
}
