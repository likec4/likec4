/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BaseError } from '@likec4/core'
import { normalizeError } from '@likec4/core'
import type { LogOutputChannel } from 'vscode'
import type TelemetryReporter from '@vscode/extension-telemetry'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Logger {
  public static channel: LogOutputChannel | null = null
  public static telemetry: TelemetryReporter | null = null

  static debug(message: string) {
    console.debug(message)
    Logger.channel?.debug(message)
  }

  static info(message: string) {
    console.info(message)
    Logger.channel?.info(message)
  }

  static warn(message: string) {
    Logger.channel?.warn(message)
  }

  static log(message: string) {
    console.log(message)
    Logger.channel?.info(message)
  }

  static error(message: string | BaseError) {
    if (typeof message !== 'string') {
      message = message.stack ? message.stack : `${message.name}: ${message.message}`
    }
    console.error(message)
    Logger.channel?.error(message)
    if (Logger.telemetry) {
      Logger.telemetry.sendTelemetryErrorEvent('error', { message })
    }
  }
}

export function logError(error: unknown): void {
  Logger.error(normalizeError(error))
}

export function logWarnError(err: unknown): void {
  const error = normalizeError(err)
  Logger.warn(`${error.name}: ${error.message}`)
}
