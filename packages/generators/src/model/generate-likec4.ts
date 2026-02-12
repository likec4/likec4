import type { ParsedLikeC4ModelData } from '@likec4/core'
import { nameFromFqn } from '@likec4/core/utils'
import { CompositeGeneratorNode, NL, toString } from 'langium/generate'
import { printDeployment } from './likec4/print-deployment'
import { printGlobals } from './likec4/print-globals'
import { printModel } from './likec4/print-model'
import { printSpecification } from './likec4/print-specification'
import { printViews } from './likec4/print-views'
import { quoteString } from './likec4/utils'

export function generateLikeC4(model: ParsedLikeC4ModelData): string {
  const out = new CompositeGeneratorNode()

  // Import declarations
  for (const [projectId, elements] of Object.entries(model.imports) as [string, { id: string }[]][]) {
    const names = elements.map(el => nameFromFqn(el.id))
    if (names.length === 1) {
      out.append('import ', names[0]!, ' from ', quoteString(projectId), NL)
    } else {
      out.append('import { ', names.join(', '), ' } from ', quoteString(projectId), NL)
    }
  }
  if (Object.keys(model.imports).length > 0) {
    out.append(NL)
  }

  // Specification block
  printSpecification(out, model.specification)
  out.append(NL)

  // Globals block (if non-empty)
  const globalsNode = new CompositeGeneratorNode()
  printGlobals(globalsNode, model.globals)
  const globalsStr = toString(globalsNode)
  if (globalsStr.trim()) {
    out.append(globalsNode, NL)
  }

  // Model block
  printModel(out, model.elements, model.relations)
  out.append(NL)

  // Deployment block (if non-empty)
  const hasDeployments = Object.keys(model.deployments.elements).length > 0
    || Object.keys(model.deployments.relations).length > 0
  if (hasDeployments) {
    printDeployment(out, model.deployments)
    out.append(NL)
  }

  // Views block
  printViews(out, model.views)

  return toString(out).replace(/\r\n/g, '\n')
}
