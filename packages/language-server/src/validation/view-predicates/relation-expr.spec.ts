import { type ExpectStatic, describe, it } from 'vitest'
import { createTestServices } from '../../test'

const model = `
    specification {
      element element
      deploymentNode node
    }
    model {
      element e1 {
        element e2
        element e3
      }
    }
    deployment {
      node n1 {
        i1 = instanceOf e1
      }
      node n2 {
      }
    }
  `

function mkTestServices(expect: ExpectStatic) {
  expect.hasAssertions()
  const { validate } = createTestServices()

  const validateView = (view: string) =>
    validate(`
      ${model}
      views {
        ${view}
      }
    `)

  const validateRules = (rules: string) =>
    validateView(`
      deployment view test {
        ${rules}
      }
    `)

  return {
    validateRules,
    view: {
      valid: async (view: string) => {
        const { errors, warnings } = await validateView(view)
        expect(errors.concat(warnings).join('\n')).toEqual('')
      },
      invalid: async (view: string) => {
        const { errors } = await validateView(view)
        expect(errors).not.toEqual([])
      },
    },
    valid: async (rules: string) => {
      const { errors, warnings } = await validateRules(rules)
      expect(errors.join('\n'), 'errors').to.be.empty
      expect(warnings.join('\n'), 'warnings').to.be.empty
    },
    onlyWarnings: async (rules: string) => {
      const { errors, warnings } = await validateRules(rules)
      expect.soft(errors.join('\n'), 'errors').to.be.empty
      expect.soft(warnings.join('\n'), 'warnings').not.to.be.empty
      return {
        errors,
        warnings,
      }
    },
    invalid: async (rules: string) => {
      const { errors, warnings } = await validateRules(rules)
      expect.soft(errors.join('\n'), 'errors').not.to.be.empty
      expect.soft(warnings.join('\n'), 'warnings').to.be.empty
      return {
        errors,
        warnings,
      }
    },
  }
}

describe.concurrent('ExpressionV2', () => {
  describe('DirectedRelationExpr', () => {
    it('should not warn', async ({ expect }) => {
      const { valid } = mkTestServices(expect)
      await valid(`
        include n1 <-> n2
      `)
    })

    it('should error if model reference in include', async ({ expect }) => {
      const { invalid } = mkTestServices(expect)
      const { errors } = await invalid(`
        include * -> e2
      `)
      expect(errors).toEqual(['Model reference is allowed in exclude predicate only'])
    })

    it('should not warn if model reference in exclude', async ({ expect }) => {
      const { valid } = mkTestServices(expect)
      await valid(`
        exclude e2 -> *
      `)
    })
  })

  describe('IncomingRelationExpr', () => {
    it('should not warn', async ({ expect }) => {
      const { valid } = mkTestServices(expect)
      await valid(`
        include -> n1._
      `)
    })

    it('should error if model reference in include', async ({ expect }) => {
      const { invalid } = mkTestServices(expect)
      const { errors } = await invalid(`
        include -> e2
      `)
      expect(errors).toEqual(['Model reference is allowed in exclude predicate only'])
    })

    it('should not warn if model reference in exclude', async ({ expect }) => {
      const { valid } = mkTestServices(expect)
      await valid(`
        exclude -> e2
      `)
    })
  })
})
