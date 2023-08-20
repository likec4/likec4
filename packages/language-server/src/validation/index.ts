import { Utils } from 'vscode-uri'
import type { ast } from '../ast'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { elementChecks } from './element'
import { relationChecks } from './relation'
import { elementKindChecks, tagChecks } from './specification'
import { viewChecks } from './view'

export function registerValidationChecks(services: LikeC4Services) {
  logger.info('registerValidationChecks')
  const registry = services.validation.ValidationRegistry
  // const checks: ValidationChecks = {
  // Element: validator.checkElementNameDuplicates,
  // Tag: validator.checkTagDuplicates,
  // ElementKind: elementKindChecks(services),
  // ElementStyleProperty: validator.checkElementStyleProperty,
  // View: validator.checkViewNameDuplicates,
  // ColorStyleProperty: validator.checkColorStyleProperty,
  // }
  registry.register<ast.LikeC4AstType>({
    ElementView: viewChecks(services),
    Element: elementChecks(services),
    ElementKind: elementKindChecks(services),
    Relation: relationChecks(services),
    Tag: tagChecks(services)
  })

  const connection = services.shared.lsp.Connection
  if (connection) {
    logger.info('registerValidationChecks')
    // wokraround for bug in langium
    services.shared.workspace.DocumentBuilder.onUpdate((changed, deleted) => {
      const message = [`[DocumentBuilder.onUpdate]`]
      if (changed.length > 0) {
        message.push(` changed:`)
        changed.forEach(u => message.push(`  - ${Utils.basename(u)}`))
      }
      if (deleted.length > 0) {
        message.push(` deleted:`)
        deleted.forEach(u => message.push(`  - ${Utils.basename(u)}`))
      }
      logger.debug(message.join('\n'))
      for (const uri of deleted) {
        void connection.sendDiagnostics({
          uri: uri.toString(),
          diagnostics: []
        })
      }
    })
  }
}
