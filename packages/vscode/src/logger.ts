/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BaseError } from '@likec4/core'
import { normalizeError } from '@likec4/core'
import type { LogOutputChannel } from 'vscode'
import type TelemetryReporter from '@vscode/extension-telemetry'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Logger {
  // TODO: dirty, refactor later
  public static channel: LogOutputChannel | null = null
  public static telemetry: TelemetryReporter | null = null

  static debug(message: string) {
    ;(Logger.channel ?? console).debug(message)
  }

  static info(message: string) {
    ;(Logger.channel ?? console).info(message)
  }

  static warn(message: string) {
    ;(Logger.channel ?? console).warn(message)
  }

  static log(message: string) {
    if (Logger.channel) {
      return Logger.channel.debug(message)
    }
    console.log(message)
  }

  static error(message: string | BaseError) {
    if (typeof message !== 'string') {
      message = message.stack ? message.stack : `${message.name}: ${message.message}`
    }
    ;(Logger.channel ?? console).error(message)
    if (Logger.telemetry) {
      Logger.telemetry.sendTelemetryErrorEvent('error', { message })
    }
  }

  static trace(message: string) {
    if (Logger.channel) {
      return Logger.channel.trace(message)
    }
    console.debug(message)
  }
}

export function logError(error: unknown): void {
  Logger.error(normalizeError(error))
}

export function logWarnError(err: unknown): void {
  const error = normalizeError(err)
  Logger.warn(`${error.name}: ${error.message}`)
}
