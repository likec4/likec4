import { describe } from 'vitest'
import { it } from './_it-spec'

describe('property-checks', () => {
  describe('icon', () => {
    it('should error duplicate icon inside style', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          element component
        }
        model {
          component c1 {
            style {
              icon tech:kafka
              icon tech:akka
            }
          }
        }
      `)
      expect(errors).toEqual([
        'Icon must be defined once',
        'Icon must be defined once',
      ])
    })

    it('should error when file:// schema used', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          element component
        }
        model {
          component c1 {
            style {
              icon file://image.png
            }
          }
        }
      `)
      expect(errors).toEqual([
        'Icon URI must not start with file://',
      ])
    })

    it('should error duplicate icon on element', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          element component
        }
        model {
          component c1 {
            icon tech:kafka
            icon tech:akka
          }
        }
      `)
      expect(errors).toEqual([
        'Icon must be defined once',
        'Icon must be defined once',
      ])
    })

    it('should warn redundant icon', async ({ expect, validate }) => {
      const { warnings } = await validate(`
        specification {
          element component
        }
        model {
          component c1 {
            icon tech:nodejs
            style {
              icon tech:kafka
            }
          }
        }
      `)
      expect(warnings).toEqual([
        'Redundant as icon defined on element',
      ])
    })
  })

  describe('notes', () => {
    it('should allow notes in view custom properties', async ({ expect, validate }) => {
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1
        component c2
      }
      views {
        view index {
          include c2 with {
            notes "element note"
          }
          include c2 -> c1 with {
            notes "some notes"
          }
        }
      }
    `)
      expect(errors).to.be.empty
    })

    it('should not report notes in dynamic view', async ({ expect, validate }) => {
      const { errors } = await validate(`
      specification {
        element component
      }
      model {
        component c1
        component c2
      }
      views {
        dynamic view index {
          c2 -> c1 {
            notes "some notes"
          }
        }
      }
    `)
      expect(errors).to.be.empty
      expect.hasAssertions()
    })
  })

  describe('color - HexColor', () => {
    it('should report invalid length hex color (numbers)', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          color c1 #1234567
        }
      `)
      expect(errors).toEqual([
        'Invalid value "#1234567", must be 3, 6 or 8 characters long',
      ])
    })
    it('should report invalid length hex color', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          color c1 #ABAB
        }
      `)
      expect(errors).toEqual([
        'Invalid value "#ABAB", must be 3, 6 or 8 characters long',
      ])
    })
    it('should report invalid hex color', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          color c1 #TTT
        }
      `)
      expect(errors).to.include.members([
        'Invalid HEX',
      ])
    })
    it('should not report valid hex color', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          color c1 #123456
          color c2 #AAA
          color c3 #12345678
        }
      `)
      expect(errors).toEqual([])
    })
  })

  describe('color - RGBAColor', () => {
    it('should report invalid red color', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          color c1 rgb( 300, 2, 3)
        }
      `)
      expect(errors).toEqual(['Invalid value, must be between 0 and 255'])
    })
    it('should report invalid green color', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          color c1 rgb(2, 300, 3)
        }
      `)
      expect(errors).toEqual(['Invalid value, must be between 0 and 255'])
    })
    it('should report invalid blue color', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          color c1 rgb(2, 3, 300)
        }
      `)
      expect(errors).toEqual(['Invalid value, must be between 0 and 255'])
    })
    it('should report invalid float alpha', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          color c1 rgba(2, 3, 4, 101)
        }
      `)
      expect(errors).toEqual(['Invalid value, must be between 0 and 1'])
    })
    it('should report invalid percentage alpha', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          color c1 rgba(2, 3, 4, 101%)
        }
      `)
      expect(errors).toEqual(['Invalid value, must be between 0% and 100%'])
    })
    it('should not report valid color', async ({ expect, validate }) => {
      const { errors } = await validate(`
        specification {
          color c1 rgb(0, 200, 255)
          color c2 rgba(0, 200, 255, 0)
          color c3 rgba(0, 200, 255, 1)
          color c4 rgba(0, 200, 255, 0.55)
          color c5 rgba(0, 200, 255, 0%)
          color c6 rgba(0, 200, 255, 55%)
          color c7 rgba(0, 200, 255, 100%)
        }
      `)
      expect(errors).toEqual([])
    })
  })

  describe('direction', () => {
    it('should not warn in relationships and element views', async ({ expect, validate }) => {
      const { errors, warnings } = await validate(`
        specification {
          element component
          relationship subscribes {
            direction back
          }
        }
        model {
          component a
          component b
          a -> b {
            style {
              direction back
            }
          }
        }
        views {
          view index {
            include *
            include a -> b with {
              direction forward
            }
          }
        }
      `)
      expect(errors).toEqual([])
      expect(warnings).toEqual([])
    })

    it('should warn in deployment views, but not on deployment relationships', async ({ expect, validate }) => {
      const { errors, warnings } = await validate(`
        specification {
          element component
          deploymentNode node
        }
        model {
          component a
          component b
          a -> b
        }
        deployment {
          node n1 {
            ia = instanceOf a
          }
          node n2 {
            ib = instanceOf b
          }
          n1.ia -> n2.ib {
            style {
              direction back
            }
          }
        }
        views {
          deployment view index {
            include *
            include n1.ia -> n2.ib with {
              direction back
            }
          }
        }
      `)
      expect(errors).toEqual([])
      expect(warnings).toEqual([
        'Direction is ignored in deployment views, set it on the relationship instead',
      ])
    })

    it('should warn in dynamic views', async ({ expect, validate }) => {
      const { errors, warnings } = await validate(`
        specification {
          element component
        }
        model {
          component a
          component b
          a -> b
        }
        views {
          dynamic view index {
            a -> b {
              direction back
            }
            include a -> b with {
              direction back
            }
          }
        }
      `)
      expect(errors).toEqual([])
      expect(warnings).toEqual([
        'Direction is ignored in dynamic views, use backward steps (a <- b) instead',
        'Direction is ignored in dynamic views, use backward steps (a <- b) instead',
      ])
    })
  })
})
