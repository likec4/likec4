import type * as c4 from '@likec4/core'
import { nonexhaustive } from '@likec4/core'
import { isTruthy } from 'remeda'
import { ast, type ParsedAstGlobals } from '../../ast'
import { logger, logWarnError } from '../../logger'
import type { WithViewsParser } from './ViewsParser'

export function GlobalsParser<TBase extends WithViewsParser>(B: TBase) {
  return class GlobalsParser extends B {
    parseGlobals() {
      const { parseResult, c4Globals } = this.doc
      const isValid = this.isValid

      const globals = parseResult.value.globals.filter(isValid)

      const elRelPredicates = globals.flatMap(r => r.predicates.filter(isValid))
      for (const predicate of elRelPredicates) {
        try {
          const globalPredicateId = predicate.name as c4.GlobalPredicateId
          if (!isTruthy(globalPredicateId)) {
            continue
          }
          if (globalPredicateId in c4Globals.predicates) {
            logger.warn(`Global predicate named "${globalPredicateId}" is already defined`)
            continue
          }

          this.parseAndStoreGlobalPredicateGroupOrDynamic(predicate, globalPredicateId, c4Globals)
        } catch (e) {
          logWarnError(e)
        }
      }

      const styles = globals.flatMap(r => r.styles.filter(isValid))
      for (const style of styles) {
        try {
          const globalStyleId = style.id.name as c4.GlobalStyleID
          if (!isTruthy(globalStyleId)) {
            continue
          }
          if (globalStyleId in c4Globals.styles) {
            logger.warn(`Global style named "${globalStyleId}" is already defined`)
            continue
          }

          const styles = this.parseGlobalStyleOrGroup(style)
          if (styles.length > 0) {
            c4Globals.styles[globalStyleId] = styles as c4.NonEmptyArray<c4.ViewRuleStyle>
          }
        } catch (e) {
          logWarnError(e)
        }
      }
    }

    parseAndStoreGlobalPredicateGroupOrDynamic(
      astRule: ast.GlobalPredicateGroup | ast.GlobalDynamicPredicateGroup,
      id: c4.GlobalPredicateId,
      c4Globals: ParsedAstGlobals
    ) {
      if (ast.isGlobalPredicateGroup(astRule)) {
        const predicates = this.parseGlobalPredicateGroup(astRule)
        if (predicates.length > 0) {
          c4Globals.predicates[id] = predicates as c4.NonEmptyArray<c4.ViewRulePredicate>
        }
        return
      }
      if (ast.isGlobalDynamicPredicateGroup(astRule)) {
        const predicates = this.parseGlobalDynamicPredicateGroup(astRule)
        if (predicates.length > 0) {
          c4Globals.dynamicPredicates[id] = predicates as c4.NonEmptyArray<c4.DynamicViewIncludeRule>
        }
        return
      }
      nonexhaustive(astRule)
    }

    parseGlobalPredicateGroup(astRule: ast.GlobalPredicateGroup): c4.ViewRulePredicate[] {
      return astRule.predicates.map(p => this.parseViewRulePredicate(p))
    }

    parseGlobalDynamicPredicateGroup(astRule: ast.GlobalDynamicPredicateGroup): c4.DynamicViewIncludeRule[] {
      return astRule.predicates.map(p => this.parseDynamicViewIncludePredicate(p))
    }

    parseGlobalStyleOrGroup(astRule: ast.GlobalStyle | ast.GlobalStyleGroup): c4.ViewRuleStyle[] {
      if (ast.isGlobalStyle(astRule)) {
        return [this.parseViewRuleStyle(astRule)]
      }
      if (ast.isGlobalStyleGroup(astRule)) {
        return astRule.styles.map(s => this.parseViewRuleStyle(s))
      }
      nonexhaustive(astRule)
    }
  }
}
