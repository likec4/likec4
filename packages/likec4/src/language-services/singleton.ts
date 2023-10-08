import type { LanguageServices, LanguageServicesOptions } from './language-services'
import { mkLanguageServices } from './language-services'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class LanguageServicesInstance {
  private static instance: LanguageServices

  static async get(
    opts: LanguageServicesOptions = {
      workspaceDir: process.cwd(),
      logValidationErrors: false
    }
  ) {
    if (!LanguageServicesInstance.instance) {
      const instance = (LanguageServicesInstance.instance = await mkLanguageServices(opts))
      if (instance.printValidationErrors()) {
        process.exit(1)
      }
    }
    return LanguageServicesInstance.instance
  }
}
