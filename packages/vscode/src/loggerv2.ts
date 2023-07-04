// import type * as vscode from 'vscode'
// import type { Telemetry } from './di'

// type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE'

// // function stringify(data: unknown) {
// //   try {
// //     return JSON.stringify(data, null, 2)
// //   } catch (e) {
// //     return `${e}`
// //   }
// // }

// export class Logger {
//   constructor(protected output: vscode.LogOutputChannel, protected telemetry: Telemetry) {}

//   protected logLevel: LogLevel = 'DEBUG'

//   public setOutputLevel(logLevel: LogLevel) {
//     this.logLevel = logLevel
//   }

//   /**
//    * Append messages to the output channel and format it with a title
//    *
//    * @param message The message to append to the output channel
//    */
//   public logDebug(message: string, data?: unknown): void {
//     this.output.debug(message, data)
//     // if (
//     //   this.logLevel === 'NONE' ||
//     //   this.logLevel === 'INFO' ||
//     //   this.logLevel === 'WARN' ||
//     //   this.logLevel === 'ERROR'
//     // ) {
//     //   return
//     // }
//     // this.logMessage(message, 'DEBUG')
//     // if (data) {
//     //   this.logObject(data)
//     // }
//   }

//   /**
//    * Append messages to the output channel and format it with a title
//    *
//    * @param message The message to append to the output channel
//    */
//   public logInfo(message: string, data?: unknown): void {
//     this.output.info(message, data)
//     // if (this.logLevel === 'NONE' || this.logLevel === 'WARN' || this.logLevel === 'ERROR') {
//     //   return
//     // }
//     // this.logMessage(message, 'INFO')
//     // if (data) {
//     //   this.logObject(data)
//     // }
//   }

//   /**
//    * Append messages to the output channel and format it with a title
//    *
//    * @param message The message to append to the output channel
//    */
//   public logWarn(message: string, data?: unknown): void {
//     this.output.warn(message, data)
//     // if (this.logLevel === 'NONE' || this.logLevel === 'ERROR') {
//     //   return
//     // }
//     // this.logMessage(message, 'WARN')
//     // if (data) {
//     //   this.logObject(data)
//     // }
//   }

//   public logError(message: string, error?: unknown) {
//     this.telemetry.sendTelemetryErrorEvent('logError', { message, error: `${error}` })
//     this.output.error(message, error)


//     // if (this.logLevel === 'NONE') {
//     //   return
//     // }
//     // this.logMessage(message, 'ERROR')
//     // if (typeof error === 'string') {
//     //   // Errors as a string usually only happen with
//     //   // plugins that don't return the expected error.
//     //   this.outputChannel.appendLine(error)
//     //   this.telemetry.sendTelemetryErrorEvent('logError', { message, error })
//     // } else if (error instanceof Error) {
//     //   if (error.message) {
//     //     this.logMessage(error.message, 'ERROR')
//     //   }
//     //   if (error.stack) {
//     //     this.outputChannel.appendLine(error.stack)
//     //   }
//     //   this.telemetry.sendTelemetryErrorEvent('logError', {
//     //     message,
//     //     error: `${error}`
//     //   })
//     // } else if (error) {
//     //   this.logObject(error)
//     //   this.telemetry.sendTelemetryErrorEvent('logError', {
//     //     message,
//     //     error: stringify(error)
//     //   })
//     // }
//   }

//   public show() {
//     this.output.show()
//   }

//   // private logObject(data: unknown): void {
//   //   // const message = JSON.parser
//   //   //   .format(JSON.stringify(data, null, 2), {
//   //   //     parser: "json",
//   //   //   })
//   //   //   .trim();
//   //   this.outputChannel.appendLine(stringify(data))
//   // }

//   // /**
//   //  * Append messages to the output channel and format it with a title
//   //  *
//   //  * @param message The message to append to the output channel
//   //  */
//   // private logMessage(message: string, logLevel: LogLevel): void {
//   //   const title = new Date().toLocaleTimeString()
//   //   this.outputChannel.appendLine(`["${logLevel}" - ${title}] ${message}`)
//   // }
// }

export {}
