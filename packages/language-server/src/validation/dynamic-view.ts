import { isSameHierarchy } from '@likec4/core'
import { type ValidationCheck, AstUtils } from 'langium'
import { isEmpty } from 'remeda'
import { ast } from '../ast'
import { isAltSteps } from '../generated/ast'
import type { LikeC4Services } from '../module'
import { elementRef } from '../utils/elementRef'
import { tryOrLog } from './_shared'

export const stepSingle = (services: LikeC4Services): ValidationCheck<ast.Step> => {
  const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((el, accept) => {
    const sourceEl: ast.Element | undefined = elementRef(el.source)
    const source = sourceEl && fqnIndex.getFqn(sourceEl)
    if (!source) {
      accept('error', 'Source not found (not parsed/indexed yet)', {
        node: el,
        property: 'source',
      })
    }

    const targetEl: ast.Element | undefined = elementRef(el.target)
    const target = targetEl && fqnIndex.getFqn(targetEl)
    if (!target) {
      accept('error', 'Target not found (not parsed/indexed yet)', {
        node: el,
        property: 'target',
      })
    }

    if (source && target && (isSameHierarchy(source, target) && source !== target)) {
      accept('error', 'Invalid parent-child relationship', {
        node: el,
      })
    }
  })
}

export const stepSeries = (services: LikeC4Services): ValidationCheck<ast.StepSeries> => {
  const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((el, accept) => {
    const source = el.source
    if (ast.isStep(source) && source.isBackward) {
      accept('error', 'Invalid chain after backward step', {
        node: el,
      })
    }

    const targetEl: ast.Element | undefined = elementRef(el.target)
    const target = targetEl && fqnIndex.getFqn(targetEl)
    if (!target) {
      accept('error', 'Target not found (not parsed/indexed yet)', {
        node: el,
        property: 'target',
      })
    }
  })
}

export const subflowStep = (
  _services: LikeC4Services,
): ValidationCheck<ast.SubflowStep> => {
  const isParallel = (astNode: ast.SubflowStep) => astNode.kind === 'par' || astNode.kind === 'parallel'

  const isAltBranch = (astNode: ast.SubflowStep) =>
    astNode.kind === 'else' || astNode.kind === 'if' || astNode.kind === 'when'

  return tryOrLog((el, accept) => {
    if (isParallel(el) && ast.isSubflowStep(el.$container) && isParallel(el.$container)) {
      accept('error', 'Nested parallel blocks are not allowed', {
        node: el,
        property: 'kind',
      })
    }

    if (isAltBranch(el)) {
      if (!isAltSteps(el.$container)) {
        accept('error', `"${el.kind}" alternative branch must be inside "alt"`, {
          node: el,
          property: 'kind',
        })
      }
    } else if (isAltSteps(el.$container)) {
      accept(
        'error',
        `"${el.kind}" can not be used as an alternative branch, only "if", "when" or "else" are allowed`,
        {
          node: el,
          property: 'kind',
        },
      )
    }
  })
}

export const dynamicViewDisplayVariant = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicViewDisplayVariantProperty> => {
  return tryOrLog((prop, accept) => {
    if (isEmpty(prop.value) || (prop.value !== 'diagram' && prop.value !== 'sequence')) {
      accept('error', 'Invalid display variant: "diagram" or "sequence" are allowed', {
        node: prop,
        property: 'value',
      })
      return
    }
    if (!AstUtils.hasContainerOfType(prop, ast.isDynamicViewBody)) {
      accept('error', `Display mode can be defined only inside dynamic view`, {
        node: prop,
      })
    }
  })
}
