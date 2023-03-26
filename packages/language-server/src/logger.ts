export const logger = {
  debug(message: string) {
    console.debug(message)
  },
  info(message: string) {
    console.info(message)
  },
  warn(message: string) {
    console.warn(message)
  },
  log(message: string) {
    console.log(message)
  },
  error(message: string | Error | unknown) {
    console.error(message)
  },
  trace(message: string) {
    console.debug(message)
  }
}
