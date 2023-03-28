import type { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { elementChecks } from './element'
import { elementKindChecks } from './specification'

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
    Element: elementChecks(services),
    ElementKind: elementKindChecks(services),
  })
}
