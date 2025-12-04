import { describe, it } from 'vitest'
import { validateProjectConfig as validateConfig } from './schema'
import { ImageAliasesSchema, validateImageAliases } from './schema.image-alias'
import { IncludeSchema, validateIncludePaths } from './schema.include'

describe('ProjectConfig schema', () => {
  describe('validateProjectConfig', () => {
    describe('name field', () => {
      it('should accept valid project names', ({ expect }) => {
        const validConfigs = [
          { name: 'my-project' },
          { name: 'project123' },
          { name: 'my_project' },
          { name: 'Project-Name_123' },
        ]

        for (const config of validConfigs) {
          expect(() => validateConfig(config)).not.toThrow()
          const result = validateConfig(config)
          expect(result.name).toBe(config.name)
        }
      })

      it('should reject empty name', ({ expect }) => {
        expect(() => validateConfig({ name: '' })).toThrow('Project name cannot be empty')
      })

      it('should reject name "default"', ({ expect }) => {
        expect(() => validateConfig({ name: 'default' })).toThrow(/Project name cannot be "default"/)
      })

      it('should reject names containing dots', ({ expect }) => {
        expect(() => validateConfig({ name: 'my.project' })).toThrow(
          /Project name cannot contain "\.", "@" or "#", try to use A-z, 0-9, _ and -/,
        )
      })

      it('should reject names containing @ symbol', ({ expect }) => {
        expect(() => validateConfig({ name: 'my@project' })).toThrow(
          /Project name cannot contain "\.", "@" or "#", try to use A-z, 0-9, _ and -/,
        )
      })

      it('should reject names containing # symbol', ({ expect }) => {
        expect(() => validateConfig({ name: 'my#project' })).toThrow(
          /Project name cannot contain "\.", "@" or "#", try to use A-z, 0-9, _ and -/,
        )
      })

      it('should require name field', ({ expect }) => {
        expect(() => validateConfig({})).toThrow()
      })
    })

    describe('optional fields', () => {
      it('should accept valid title', ({ expect }) => {
        const config = { name: 'test', title: 'My Test Project' }
        const result = validateConfig(config)
        expect(result.title).toBe('My Test Project')
      })

      it('should reject empty title when provided', ({ expect }) => {
        expect(() => validateConfig({ name: 'test', title: '' })).toThrow(
          'Project title cannot be empty if specified',
        )
      })

      it('should accept valid contactPerson', ({ expect }) => {
        const config = { name: 'test', contactPerson: 'John Doe' }
        const result = validateConfig(config)
        expect(result.contactPerson).toBe('John Doe')
      })

      it('should reject empty contactPerson when provided', ({ expect }) => {
        expect(() => validateConfig({ name: 'test', contactPerson: '' })).toThrow(
          'Contact person cannot be empty if specified',
        )
      })

      it('should accept valid exclude array', ({ expect }) => {
        const config = { name: 'test', exclude: ['**/node_modules/**', '**/dist/**'] }
        const result = validateConfig(config)
        expect(result.exclude).toEqual(['**/node_modules/**', '**/dist/**'])
      })
    })

    describe('imageAliases field', () => {
      it('should accept valid imageAliases', ({ expect }) => {
        const validConfigs = [
          {
            name: 'test',
            imageAliases: {
              '@icons': './images/icons',
              '@brand': '../assets/brand',
              '@': './images',
              '@my-images': 'relative/path',
              '@icons_2': './nested/folder/path',
            },
          },
        ]

        for (const config of validConfigs) {
          expect(() => validateConfig(config)).not.toThrow()
          const result = validateConfig(config)
          expect(result.imageAliases).toEqual(config.imageAliases)
        }
      })

      it('should reject keys not starting with @', ({ expect }) => {
        const config = {
          name: 'test',
          imageAliases: {
            'icons': './images', // Missing @
          },
        }
        expect(() => validateConfig(config)).toThrow(
          'Invalid image alias key(s): "icons" (must match /^@[A-Za-z0-9_-]*$/)',
        )
      })

      it('should reject keys with invalid characters', ({ expect }) => {
        const invalidKeys = ['@icons.old', '@icons/sub', '@icons space', '@icons+new']

        for (const key of invalidKeys) {
          const config = {
            name: 'test',
            imageAliases: { [key]: './images' },
          }
          expect(() => validateConfig(config), `Key "${key}" should be rejected`).toThrow(
            'Invalid image alias key(s):',
          )
        }
      })

      it('should reject absolute paths as values', ({ expect }) => {
        const absolutePaths = ['/absolute/path', 'C:\\absolute\\path']

        for (const path of absolutePaths) {
          const config = {
            name: 'test',
            imageAliases: { '@icons': path },
          }
          expect(() => validateConfig(config), `Path "${path}" should be rejected`).toThrow(
            'Image alias value must be a relative path (no leading slash or protocol)',
          )
        }
      })

      it('should reject URLs as values', ({ expect }) => {
        const urls = ['http://example.com/images', 'https://cdn.example.com/assets', 'file://local/path']

        for (const url of urls) {
          const config = {
            name: 'test',
            imageAliases: { '@icons': url },
          }
          expect(() => validateConfig(config), `URL "${url}" should be rejected`).toThrow(
            'Image alias value must be a relative path (no leading slash or protocol)',
          )
        }
      })

      it('should reject empty values', ({ expect }) => {
        const config = {
          name: 'test',
          imageAliases: { '@icons': '' },
        }
        expect(() => validateConfig(config)).toThrow('Image alias value cannot be empty')
      })

      it('should accept relative paths', ({ expect }) => {
        const relativePaths = ['./images', '../assets', 'images/icons', 'nested/folder/path']

        for (const path of relativePaths) {
          const config = {
            name: 'test',
            imageAliases: { '@icons': path },
          }
          expect(() => validateConfig(config), `Path "${path}" should be accepted`).not.toThrow()
        }
      })
    })

    describe('include field', () => {
      it('should accept valid include paths', ({ expect }) => {
        const validConfigs = [
          {
            name: 'test',
            include: ['../shared'],
          },
          {
            name: 'test',
            include: ['../shared', '../common/specs'],
          },
          {
            name: 'test',
            include: ['./local-shared', '../parent/shared'],
          },
          {
            name: 'test',
            include: ['relative/path/to/shared'],
          },
        ]

        for (const config of validConfigs) {
          expect(() => validateConfig(config)).not.toThrow()
          const result = validateConfig(config)
          expect(result.include).toEqual(config.include)
        }
      })

      it('should accept empty include array', ({ expect }) => {
        const config = { name: 'test', include: [] }
        const result = validateConfig(config)
        expect(result.include).toEqual([])
      })

      it('should accept undefined include', ({ expect }) => {
        const config = { name: 'test' }
        const result = validateConfig(config)
        expect(result.include).toBeUndefined()
      })

      it('should reject absolute paths in include', ({ expect }) => {
        const absolutePaths = ['/absolute/path', 'C:\\absolute\\path', 'D:/another/path']

        for (const path of absolutePaths) {
          const config = {
            name: 'test',
            include: [path],
          }
          expect(() => validateConfig(config), `Path "${path}" should be rejected`).toThrow(
            'Include path must be a relative path (no leading slash, drive letter, or protocol)',
          )
        }
      })

      it('should reject URLs in include', ({ expect }) => {
        const urls = ['http://example.com/shared', 'https://cdn.example.com/specs', 'file://local/path']

        for (const url of urls) {
          const config = {
            name: 'test',
            include: [url],
          }
          expect(() => validateConfig(config), `URL "${url}" should be rejected`).toThrow(
            'Include path must be a relative path (no leading slash, drive letter, or protocol)',
          )
        }
      })

      it('should reject empty strings in include array', ({ expect }) => {
        const config = {
          name: 'test',
          include: [''],
        }
        expect(() => validateConfig(config)).toThrow('Include path cannot be empty')
      })

      it('should reject mixed valid and invalid paths', ({ expect }) => {
        const config = {
          name: 'test',
          include: ['../shared', '/absolute/path'],
        }
        expect(() => validateConfig(config)).toThrow(
          'Include path must be a relative path (no leading slash, drive letter, or protocol)',
        )
      })
    })

    it('should parse valid JSON5 config', ({ expect }) => {
      const json5Config = `{
        name: "test-project",
        title: "Test Project",
        // This is a comment
        imageAliases: {
          "@icons": "./images"
        }
      }`

      const result = validateConfig(json5Config)
      expect(result.name).toBe('test-project')
      expect(result.title).toBe('Test Project')
      expect(result.imageAliases).toEqual({ '@icons': './images' })
    })

    it('should throw on invalid JSON5', ({ expect }) => {
      const invalidJson = '{ name: "test", invalid syntax }'
      expect(() => validateConfig(invalidJson)).toThrow()
    })

    it('should throw on valid JSON5 but invalid schema', ({ expect }) => {
      const invalidConfig = '{ name: "default" }' // 'default' is not allowed
      expect(() => validateConfig(invalidConfig)).toThrow('Project name cannot be "default"')
    })
  })

  describe('ImageAliasesSchema', () => {
    describe('validation with valibot', () => {
      it('should accept valid image aliases object', ({ expect }) => {
        const validAliases = {
          '@icons': './images/icons',
          '@brand': '../assets/brand',
          '@': './images',
          '@my-images': 'relative/path',
          '@icons_2': './nested/folder/path',
          '@test-alias': 'some/path',
        }

        expect(() => ImageAliasesSchema.parse(validAliases)).not.toThrow()
        const result = ImageAliasesSchema.parse(validAliases)
        expect(result).toEqual(validAliases)
      })

      it('should reject empty values', ({ expect }) => {
        const aliasesWithEmptyValue = { '@icons': '' }
        expect(() => ImageAliasesSchema.parse(aliasesWithEmptyValue)).toThrow(
          'Image alias value cannot be empty',
        )
      })

      it('should reject absolute paths', ({ expect }) => {
        const absolutePaths = [
          { '@icons': '/absolute/path' },
          { '@brand': 'C:\\absolute\\path' },
          { '@assets': 'D:/another/absolute/path' },
        ]

        for (const aliases of absolutePaths) {
          expect(
            () => ImageAliasesSchema.parse(aliases),
            `Should reject ${Object.values(aliases)[0]}`,
          ).toThrow(
            'Image alias value must be a relative path (no leading slash or protocol)',
          )
        }
      })

      it('should reject URLs', ({ expect }) => {
        const urlPaths = [
          { '@icons': 'http://example.com/images' },
          { '@brand': 'https://cdn.example.com/assets' },
          { '@assets': 'file://local/path' },
          { '@ftp': 'ftp://server.com/files' },
        ]

        for (const aliases of urlPaths) {
          expect(() => ImageAliasesSchema.parse(aliases), `Should reject ${Object.values(aliases)[0]}`).toThrow(
            'Image alias value must be a relative path (no leading slash or protocol)',
          )
        }
      })

      it('should accept relative paths', ({ expect }) => {
        const relativePaths = [
          { '@icons': './images' },
          { '@brand': '../assets' },
          { '@nested': 'images/icons' },
          { '@deep': 'very/deep/nested/folder/path' },
          { '@current': '.' },
          { '@parent': '..' },
        ]

        for (const aliases of relativePaths) {
          expect(() => ImageAliasesSchema.parse(aliases), `Should accept ${Object.values(aliases)[0]}`).not.toThrow()
          const result = ImageAliasesSchema.parse(aliases)
          expect(result).toEqual(aliases)
        }
      })
    })
  })

  describe('validateImageAliases', () => {
    it('should pass with valid image aliases', ({ expect }) => {
      const validAliases = {
        '@icons': './images/icons',
        '@brand': '../assets/brand',
        '@': './images',
        '@my-images': 'relative/path',
        '@icons_2': './nested/folder/path',
        '@test-alias': 'some/path',
      }

      expect(() => validateImageAliases(validAliases)).not.toThrow()
    })

    it('should pass when imageAliases is undefined', ({ expect }) => {
      expect(() => validateImageAliases(undefined)).not.toThrow()
      expect(() => validateImageAliases()).not.toThrow()
    })

    it('should pass when imageAliases is empty object', ({ expect }) => {
      expect(() => validateImageAliases({})).not.toThrow()
    })

    it('should reject keys not starting with @', ({ expect }) => {
      const invalidAliases = {
        'icons': './images', // Missing @
        'brand': './assets', // Missing @
      }

      expect(() => validateImageAliases(invalidAliases)).toThrow(
        'Invalid image alias key(s): "icons", "brand" (must match /^@[A-Za-z0-9_-]*$/)',
      )
    })

    it('should reject keys with invalid characters', ({ expect }) => {
      const testCases = [
        { key: '@icons.old', expected: '"@icons.old"' },
        { key: '@icons/sub', expected: '"@icons/sub"' },
        { key: '@icons space', expected: '"@icons space"' },
        { key: '@icons+new', expected: '"@icons+new"' },
        { key: '@icons@special', expected: '"@icons@special"' },
        { key: '@icons#hash', expected: '"@icons#hash"' },
      ]

      for (const { key, expected } of testCases) {
        const aliases = { [key]: './images' }
        expect(() => validateImageAliases(aliases), `Key "${key}" should be rejected`).toThrow(
          `Invalid image alias key(s): ${expected} (must match /^@[A-Za-z0-9_-]*$/)`,
        )
      }
    })

    it('should reject absolute paths as values', ({ expect }) => {
      const testCases = [
        { '@icons': '/absolute/path' },
        { '@brand': 'C:\\absolute\\path' },
        { '@assets': 'D:/another/absolute/path' },
      ]

      for (const aliases of testCases) {
        const entry = Object.entries(aliases)[0]
        if (entry) {
          const [_key, value] = entry
          expect(() => validateImageAliases(aliases), `Path "${value}" should be rejected`).toThrow(
            'Invalid image alias value(s):',
          )
        }
      }
    })

    it('should reject URLs as values', ({ expect }) => {
      const testCases = [
        { '@icons': 'http://example.com/images' },
        { '@brand': 'https://cdn.example.com/assets' },
        { '@assets': 'file://local/path' },
        { '@ftp': 'ftp://server.com/files' },
      ]

      for (const aliases of testCases) {
        const entry = Object.entries(aliases)[0]
        if (entry) {
          const [key, value] = entry
          expect(() => validateImageAliases(aliases), `URL "${value}" should be rejected`).toThrow(
            `Invalid image alias value(s): "${key} -> ${value}"`,
          )
        }
      }
    })

    it('should report multiple invalid keys', ({ expect }) => {
      const aliases = {
        'icons': './images', // Missing @
        'brand': './assets', // Missing @
        '@valid': './valid/path',
        '@icons.old': './old', // Invalid character
      }

      expect(() => validateImageAliases(aliases)).toThrow(
        'Invalid image alias key(s): "icons", "brand", "@icons.old" (must match /^@[A-Za-z0-9_-]*$/)',
      )
    })

    it('should report multiple invalid values', ({ expect }) => {
      const aliases = {
        '@icons': '/absolute/path', // Absolute path
        '@brand': 'http://example.com', // URL
        '@valid': './valid/path',
      }

      expect(() => validateImageAliases(aliases)).toThrow(
        'Invalid image alias value(s): "@icons -> /absolute/path", "@brand -> http://example.com"',
      )
    })

    it('should report both invalid keys and values', ({ expect }) => {
      const aliases = {
        'icons': '/absolute/path', // Invalid key and value
        '@brand': 'https://example.com', // Invalid value
        '@invalid.key': './valid/path', // Invalid key
      }

      expect(() => validateImageAliases(aliases)).toThrow()

      try {
        validateImageAliases(aliases)
      } catch (error) {
        const message = (error as Error).message
        expect(message).toContain('Invalid image alias key(s):')
        expect(message).toContain('Invalid image alias value(s):')
        expect(message).toContain('"icons"')
        expect(message).toContain('"@invalid.key"')
        expect(message).toContain('"@brand -> https://example.com"')
        expect(message).toContain('"icons -> /absolute/path"')
      }
    })

    it('should accept valid keys with various allowed characters', ({ expect }) => {
      const validAliases = {
        '@': './root',
        '@a': './single-letter',
        '@123': './numbers',
        '@test_name': './with-underscore',
        '@test-name': './with-dash',
        '@Test_Name-123': './mixed-case-and-chars',
      }

      expect(() => validateImageAliases(validAliases)).not.toThrow()
    })

    it('should accept various valid relative paths', ({ expect }) => {
      const validAliases = {
        '@current': '.',
        '@parent': '..',
        '@simple': 'path',
        '@nested': 'nested/path',
        '@deep': 'very/deep/nested/folder/structure',
        '@dotstart': './relative',
        '@dotdotstart': '../parent/relative',
        '@mixed': 'path/with-dashes_and.dots',
      }

      expect(() => validateImageAliases(validAliases)).not.toThrow()
    })
  })

  describe('IncludeSchema', () => {
    it('should accept valid include paths array', ({ expect }) => {
      const validPaths = ['../shared', '../common/specs', './local', 'relative/path']

      expect(() => IncludeSchema.parse(validPaths)).not.toThrow()
      const result = IncludeSchema.parse(validPaths)
      expect(result).toEqual(validPaths)
    })

    it('should accept empty array', ({ expect }) => {
      expect(() => IncludeSchema.parse([])).not.toThrow()
      const result = IncludeSchema.parse([])
      expect(result).toEqual([])
    })

    it('should accept undefined', ({ expect }) => {
      expect(() => IncludeSchema.parse(undefined)).not.toThrow()
      const result = IncludeSchema.parse(undefined)
      expect(result).toBeUndefined()
    })

    it('should reject empty strings', ({ expect }) => {
      expect(() => IncludeSchema.parse([''])).toThrow('Include path cannot be empty')
    })

    it('should reject absolute paths', ({ expect }) => {
      const absolutePaths = ['/absolute/path', 'C:\\absolute\\path', 'D:/another/path']

      for (const path of absolutePaths) {
        expect(() => IncludeSchema.parse([path]), `Should reject ${path}`).toThrow(
          'Include path must be a relative path (no leading slash, drive letter, or protocol)',
        )
      }
    })

    it('should reject URLs', ({ expect }) => {
      const urls = ['http://example.com/shared', 'https://cdn.example.com/specs', 'file://local/path']

      for (const url of urls) {
        expect(() => IncludeSchema.parse([url]), `Should reject ${url}`).toThrow(
          'Include path must be a relative path (no leading slash, drive letter, or protocol)',
        )
      }
    })

    it('should accept various relative paths', ({ expect }) => {
      const relativePaths = [
        '.',
        '..',
        './relative',
        '../parent',
        'simple',
        'nested/path',
        'very/deep/nested/folder/structure',
        '../parent/relative',
        'path/with-dashes_and.dots',
      ]

      expect(() => IncludeSchema.parse(relativePaths)).not.toThrow()
      const result = IncludeSchema.parse(relativePaths)
      expect(result).toEqual(relativePaths)
    })
  })

  describe('validateIncludePaths', () => {
    it('should pass with valid include paths', ({ expect }) => {
      const validPaths = ['../shared', '../common/specs', './local', 'relative/path']
      expect(() => validateIncludePaths(validPaths)).not.toThrow()
    })

    it('should pass when include is undefined', ({ expect }) => {
      expect(() => validateIncludePaths(undefined)).not.toThrow()
      expect(() => validateIncludePaths()).not.toThrow()
    })

    it('should pass when include is empty array', ({ expect }) => {
      expect(() => validateIncludePaths([])).not.toThrow()
    })

    it('should reject absolute paths', ({ expect }) => {
      const absolutePaths = ['/absolute/path']
      expect(() => validateIncludePaths(absolutePaths)).toThrow(
        'Invalid include path(s): "/absolute/path" (must be relative paths without leading slash, drive letter, or protocol)',
      )
    })

    it('should reject URLs', ({ expect }) => {
      const urlPaths = ['http://example.com/shared']
      expect(() => validateIncludePaths(urlPaths)).toThrow(
        'Invalid include path(s): "http://example.com/shared" (must be relative paths without leading slash, drive letter, or protocol)',
      )
    })

    it('should report multiple invalid paths', ({ expect }) => {
      const mixedPaths = ['/absolute/path', 'https://example.com/shared']
      expect(() => validateIncludePaths(mixedPaths)).toThrow(
        'Invalid include path(s): "/absolute/path", "https://example.com/shared" (must be relative paths without leading slash, drive letter, or protocol)',
      )
    })

    it('should accept various valid relative paths', ({ expect }) => {
      const validPaths = [
        '.',
        '..',
        './relative',
        '../parent',
        'simple',
        'nested/path',
        'very/deep/nested/folder/structure',
      ]
      expect(() => validateIncludePaths(validPaths)).not.toThrow()
    })
  })
})
