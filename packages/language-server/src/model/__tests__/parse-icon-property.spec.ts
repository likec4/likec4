import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

describe('parseIconProperty', () => {
  it('should parse working library icon references', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon aws:ec2 }
        comp2 = component { icon azure:virtual-machine }
        comp3 = component { icon gcp:compute-engine }
        comp4 = component { icon tech:react }
      }
    `)

    const model = await buildLikeC4Model()

    // Some library icons work
    expect(model.element('comp1').icon).toBe('aws:ec2')
    expect(model.element('comp2').icon).toBe('azure:virtual-machine')
    expect(model.element('comp3').icon).toBe('gcp:compute-engine')
    expect(model.element('comp4').icon).toBe('tech:react')
  })

  it('should handle "none" value as literal string', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon none }
      }
    `)

    const model = await buildLikeC4Model()
    // "none" is treated as literal string, not null
    expect(model.element('comp1').icon).toBe('none')
  })

  it('should parse HTTP/HTTPS/FTP URLs correctly', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon https://example.com/icon.svg }
        comp2 = component { icon http://example.com/icon.png }
        comp3 = component { icon ftp://ftp.example.com/icon.gif }
      }
    `)

    const model = await buildLikeC4Model()
    expect(model.element('comp1').icon).toBe('https://example.com/icon.svg')
    expect(model.element('comp2').icon).toBe('http://example.com/icon.png')
    expect(model.element('comp3').icon).toBe('ftp://ftp.example.com/icon.gif')
  })

  it('should reject file:// URLs with validation error', async ({ expect }) => {
    const { validate } = createTestServices()
    const result = await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon file:///local/icon.svg }
      }
    `)

    expect(result.errors).toContain('Icon URI must not start with file://')
  })

  it('should cause parsing errors for data: URLs', async ({ expect }) => {
    const { validate } = createTestServices()
    const result = await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon data:image/svg+xml;base64,PHN2Zy... }
      }
    `)

    // data: URLs cause parsing errors
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('but found: \'data\'')
  })

  it('should resolve relative paths with workspace prefix', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon ./models/icon.svg }
        comp2 = component { icon ../parent/icon.png }
        comp3 = component { icon subfolder/icon.webp }
      }
    `)

    const model = await buildLikeC4Model()
    // Explicit relative paths with ./ and ../ are resolved against the test workspace/src directory
    expect(model.element('comp1').icon).toBe('file:///test/workspace/src/models/icon.svg')
    expect(model.element('comp2').icon).toBe('file:///test/workspace/parent/icon.png')

    // Implicit relative paths (without ./) return null
    expect(model.element('comp3').icon).toBeNull()
  })

  it('should resolve absolute paths with workspace prefix', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon /assets/icon.png }
        comp2 = component { icon /global/icon.gif }
      }
    `)

    const model = await buildLikeC4Model()
    // Absolute paths are resolved relative to workspace, not truly absolute
    expect(model.element('comp1').icon).toBe('file:///test/workspace/assets/icon.png')
    expect(model.element('comp2').icon).toBe('file:///test/workspace/global/icon.gif')
  })

  it('should return null for invalid image aliases', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon @icons/custom }
        comp2 = component { icon @myicons/logo }
      }
    `)

    const model = await buildLikeC4Model()

    expect(model.element('comp1').icon).toBe(null)
    expect(model.element('comp2').icon).toBe(null)
  })

  it('use default image alias even when others are defined', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices({
      workspace: 'file:///testing/nested/image-alias/workspace',
      projectConfig: {
        imageAliases: {
          '@icons': '../../assets/images/icons/',
        },
      },
    })
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon @/logo.svg }
        comp2 = component { icon @icons/custom.svg }
      }
    `)

    const model = await buildLikeC4Model()

    // createTestService puts all virtual files in a /src folder
    // inside the provided workspace, so the expectations
    // account for the extra folder.
    expect(model.element('comp1').icon).toBe('file:///testing/nested/image-alias/workspace/src/images/logo.svg')
    expect(model.element('comp2').icon).toBe(
      'file:///testing/nested/image-alias/workspace/src/../../assets/images/icons/custom.svg',
    )
  })

  it('use image alias paths when using nested (non-rooted) LikeC4 files', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices({
      workspace: 'file:///testing/nested/image-alias/workspace',
      projectConfig: {
        imageAliases: {
          '@icons': '../../assets/images/icons/',
        },
      },
    })
    const { document } = await validate(
      `
      specification {
        element component
      }
      model {
        comp1 = component { icon @/logo.svg }
        comp2 = component { icon @icons/custom.svg }
      }
    `,
      // Do not use a slash at the start...!
      'deeper/nested/path.likec4',
    )

    const model = await buildLikeC4Model()

    // createTestService puts all virtual files in a /src folder
    // inside the provided workspace, so the expectations
    // account for the extra folder.
    expect(model.element('comp1').icon).toBe('file:///testing/nested/image-alias/workspace/src/images/logo.svg')
    expect(model.element('comp2').icon).toBe(
      'file:///testing/nested/image-alias/workspace/src/../../assets/images/icons/custom.svg',
    )
  })

  it('should return relative paths for image aliases', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices({
      workspace: 'file:///testing/nested/image-alias/workspace',
      projectConfig: {
        imageAliases: {
          '@': '../asset-images/',
          '@icons': '../../assets/images/icons/',
        },
      },
    })
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon @/logo.svg }
        comp2 = component { icon @icons/custom.svg }
      }
    `)

    const model = await buildLikeC4Model()

    // createTestService puts all virtual files in a /src folder
    // inside the provided workspace, so the expectations
    // account for the extra folder.
    expect(model.element('comp1').icon).toBe(
      'file:///testing/nested/image-alias/workspace/src/../asset-images/logo.svg',
    )
    expect(model.element('comp2').icon).toBe(
      'file:///testing/nested/image-alias/workspace/src/../../assets/images/icons/custom.svg',
    )
  })

  it('should parse icons from style blocks (not return null)', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component {
          style {
            icon https://example.com/style-icon.svg
            color blue
            shape cylinder
          }
        }
      }
    `)

    const model = await buildLikeC4Model()
    const element = model.element('comp1')

    expect(element.icon).toBe('https://example.com/style-icon.svg')
    expect(element.color).toBe('blue')
    expect(element.shape).toBe('cylinder')
  })

  it('should handle unsupported URL schemes', async ({ expect }) => {
    const { validate } = createTestServices()
    const result = await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon mailto:user@example.com }
      }
    `)

    // These schemes cause parsing errors and prevent model creation
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some(error => error.includes('but found: \'mailto\''))).toBe(true)
  })

  it('should demonstrate comprehensive icon parsing behavior', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        // Working cases
        lib_icon = component { icon aws:ec2 }
        https_url = component { icon https://cdn.example.com/icon.svg }
        http_url = component { icon http://example.com/icon.png }
        alias_icon = component { icon @/logo.svg }
        ftp_url = component { icon ftp://files.example.com/icon.gif }
        rel_path = component { icon ./assets/icon.svg }
        abs_path = component { icon /global/icon.gif }
        none_val = component { icon none }
        
        // Style block icons
        style_icon = component {
          style {
            icon https://example.com/styled.svg
          }
        }
      }
    `)

    const model = await buildLikeC4Model()

    // Verify all components were created
    const elementIds = [...model.elements()].map(e => e.id).sort()
    expect(elementIds).toEqual([
      'abs_path',
      'alias_icon',
      'ftp_url',
      'http_url',
      'https_url',
      'lib_icon',
      'none_val',
      'rel_path',
      'style_icon',
    ])

    // Verify icon resolution behavior
    expect(model.element('lib_icon').icon).toBe('aws:ec2')
    expect(model.element('https_url').icon).toBe('https://cdn.example.com/icon.svg')
    expect(model.element('http_url').icon).toBe('http://example.com/icon.png')
    expect(model.element('ftp_url').icon).toBe('ftp://files.example.com/icon.gif')
    expect(model.element('rel_path').icon).toBe('file:///test/workspace/src/assets/icon.svg')
    expect(model.element('abs_path').icon).toBe('file:///test/workspace/global/icon.gif')
    expect(model.element('none_val').icon).toBe('none')
    // We haven't set any image aliases, so it used the default './images/' alias.
    expect(model.element('alias_icon').icon).toBe('file:///test/workspace/images/logo.svg')
    expect(model.element('style_icon').icon).toBe('https://example.com/styled.svg')
  })

  it('should validate explicit relative path resolution', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon ./icon.svg }
        comp2 = component { icon ../icon.png }
        comp3 = component { icon /abs/icon.webp }
      }
    `)

    const model = await buildLikeC4Model()

    // Explicit relative paths (./, ../) and absolute paths resolve correctly
    expect(model.element('comp1').icon).toBe('file:///test/workspace/src/icon.svg')
    expect(model.element('comp2').icon).toBe('file:///test/workspace/icon.png')
    expect(model.element('comp3').icon).toBe('file:///test/workspace/abs/icon.webp')
  })

  it('should return null for implicit relative paths', async ({ expect }) => {
    const { validate, buildLikeC4Model } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component { icon dir/icon.gif }
      }
    `)

    const model = await buildLikeC4Model()

    // Implicit relative paths (without ./) return null
    expect(model.element('comp1').icon).toBeNull()
  })
})
