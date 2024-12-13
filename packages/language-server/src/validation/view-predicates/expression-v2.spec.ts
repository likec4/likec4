import { describe, type ExpectStatic, it } from 'vitest'
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
    view: {
      valid: async (view: string) => {
        const { errors, warnings } = await validateView(view)
        expect(errors.concat(warnings).join('\n')).toEqual('')
      },
      invalid: async (view: string) => {
        const { errors } = await validateView(view)
        expect(errors).not.toEqual([])
      }
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
        warnings
      }
    },
    invalid: async (rules: string) => {
      const { errors, warnings } = await validateRules(rules)
      expect.soft(errors.join('\n'), 'errors').not.to.be.empty
      expect.soft(warnings.join('\n'), 'warnings').to.be.empty
      return {
        errors,
        warnings
      }
    }
  }
}

describe.concurrent('ExpressionV2', () => {
  describe('FqnRefExpr', () => {
    it('should not warn', async ({ expect }) => {
      const { validate } = createTestServices()
      const { errors } = await validate(`${model}
      views {
        deployment view dep1 {
          include n1.i1
        }
      }
    `)
      expect(errors).toEqual([])
    })

    it('should error if include model element', async ({ expect }) => {
      const { invalid } = mkTestServices(expect)
      const { errors } = await invalid(`
        include e2
      `)
      expect(errors).toHaveLength(1)
      expect(errors).toEqual(['Must reference deployment model'])
    })

    it('should error if include model element with selector', async ({ expect }) => {
      const { invalid } = mkTestServices(expect)
      const { errors } = await invalid(`
        include e2.**
      `)
      expect(errors).toHaveLength(1)
      expect(errors).toEqual(['Must reference deployment model'])
    })

    it('should error if include instances internals', async ({ expect }) => {
      const { invalid } = mkTestServices(expect)
      const { errors } = await invalid(`
        include i1.e2
      `)
      expect(errors).toHaveLength(1)
      expect(errors).toEqual(['Must reference deployment nodes or instances, but not internals'])
    })

    it('should warn if instance with selector', async ({ expect }) => {
      const { onlyWarnings } = mkTestServices(expect)
      const { warnings } = await onlyWarnings(`
        include i1._
      `)
      expect(warnings).toEqual([
        `Selector '._' applies to deployment nodes only, ignored here`
      ])
    })

    it('should not warn if node with selector', async ({ expect }) => {
      const { valid } = mkTestServices(expect)
      await valid(`
        include n1._
      `)
    })
  })
})
