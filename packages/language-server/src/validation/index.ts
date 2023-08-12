import type { ast } from '../ast'
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
}
