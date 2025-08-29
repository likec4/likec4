import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import { ImageAliasesSchema, validateImageAliases } from '../config/imageAliasSchema'
import { parseConfigJson, ProjectConfig, validateConfig } from '../config/schema'

describe('ProjectConfig schema', () => {
  describe('validateConfig', () => {
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
        expect(() => validateConfig({ name: 'default' })).toThrow('Project name cannot be "default"')
      })

      it('should reject names containing dots', ({ expect }) => {
        expect(() => validateConfig({ name: 'my.project' })).toThrow(
          'Project name cannot contain ".", try to use A-z, 0-9, _ and -',
        )
      })

      it('should reject names containing @ symbol', ({ expect }) => {
        expect(() => validateConfig({ name: 'my@project' })).toThrow(
          'Project name cannot contain "@", try to use A-z, 0-9, _ and -',
        )
      })

      it('should reject names containing # symbol', ({ expect }) => {
        expect(() => validateConfig({ name: 'my#project' })).toThrow(
          'Project name cannot contain "#", try to use A-z, 0-9, _ and -',
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
  })

  describe('parseConfigJson', () => {
    it('should parse valid JSON5 config', ({ expect }) => {
      const json5Config = `{
        name: "test-project",
        title: "Test Project",
        // This is a comment
        imageAliases: {
          "@icons": "./images"
        }
      }`

      const result = parseConfigJson(json5Config)
      expect(result.name).toBe('test-project')
      expect(result.title).toBe('Test Project')
      expect(result.imageAliases).toEqual({ '@icons': './images' })
    })

    it('should throw on invalid JSON5', ({ expect }) => {
      const invalidJson = '{ name: "test", invalid syntax }'
      expect(() => parseConfigJson(invalidJson)).toThrow()
    })

    it('should throw on valid JSON5 but invalid schema', ({ expect }) => {
      const invalidConfig = '{ name: "default" }' // 'default' is not allowed
      expect(() => parseConfigJson(invalidConfig)).toThrow('Project name cannot be "default"')
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

        expect(() => v.parse(ImageAliasesSchema, validAliases)).not.toThrow()
        const result = v.parse(ImageAliasesSchema, validAliases)
        expect(result).toEqual(validAliases)
      })

      it('should reject empty values', ({ expect }) => {
        const aliasesWithEmptyValue = { '@icons': '' }
        expect(() => v.parse(ImageAliasesSchema, aliasesWithEmptyValue)).toThrow(
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
          expect(() => v.parse(ImageAliasesSchema, aliases), `Should reject ${Object.values(aliases)[0]}`).toThrow(
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
          expect(() => v.parse(ImageAliasesSchema, aliases), `Should reject ${Object.values(aliases)[0]}`).toThrow(
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
          expect(() => v.parse(ImageAliasesSchema, aliases), `Should accept ${Object.values(aliases)[0]}`).not.toThrow()
          const result = v.parse(ImageAliasesSchema, aliases)
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
          const [key, value] = entry
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
})
