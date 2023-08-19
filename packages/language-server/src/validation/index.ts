import { Utils } from 'vscode-uri'
import type { ast } from '../ast'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { elementChecks } from './element'
import { relationChecks } from './relation'
import { elementKindChecks, tagChecks } from './specification'
import { viewChecks } from './view'

export function registerValidationChecks(services: LikeC4Services) {
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
    // wokraround for bug in langium
    services.shared.workspace.DocumentBuilder.onUpdate((changed, deleted) => {
      logger.debug('') // empty line to separate batches
      logger.debug(`[DocumentBuilder.onUpdate]`)
      if (changed.length > 0) {
        logger.debug(` changed:\n` + changed.map(u => '  - ' + Utils.basename(u)).join('\n'))
      }
      if (deleted.length > 0) {
        logger.debug(` deleted:\n` + deleted.map(u => '  - ' + Utils.basename(u)).join('\n'))
      }
      for (const uri of deleted) {
        void connection.sendDiagnostics({
          uri: uri.toString(),
          diagnostics: []
        })
      }
    })
  }
}
