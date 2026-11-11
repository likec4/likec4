import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it } from 'vitest'
import z from 'zod/v4'
import { LikeC4ProjectConfigOps, LikeC4ProjectJsonConfigSchema, validateProjectConfig } from './schema'

const validate = (dependencies: unknown) => validateProjectConfig({ name: 'consumer', dependencies })

describe('dependencies config', () => {
  describe('paths', () => {
    it('should accept relative paths', ({ expect }) => {
      const config = validate({
        shared: '../shared-model',
        nested: 'libs/billing',
        current: './local',
      })
      expect(config.dependencies).toEqual({
        shared: '../shared-model',
        nested: 'libs/billing',
        current: './local',
      })
    })

    it('should accept empty dependencies object', ({ expect }) => {
      expect(validate({}).dependencies).toEqual({})
    })

    it('should keep dependencies undefined when the section is missing', ({ expect }) => {
      expect(validateProjectConfig({ name: 'consumer' }).dependencies).toBeUndefined()
    })

    it.for([
      '/abs/path',
      '\\abs\\path',
      '\\\\server\\share',
    ])('should reject absolute path %s', (path, { expect }) => {
      expect(() => validate({ shared: path })).toThrow(/Dependency path must be a relative path string/)
    })

    it.for([
      'C:\\models\\shared',
      'c:/models/shared',
      'C:foo',
      'C:',
      'c:bar\\baz',
    ])('should reject path with drive letter %s', (path, { expect }) => {
      expect(() => validate({ shared: path })).toThrow(/Dependency path must be a relative path string/)
    })

    it.for([
      'https://github.com/acme/shared',
      'file:///models/shared',
      'git+ssh://git@github.com/acme/shared.git',
    ])('should reject path with protocol %s', (path, { expect }) => {
      expect(() => validate({ shared: path })).toThrow(/Dependency path must be a relative path string/)
    })

    it('should reject empty path', ({ expect }) => {
      expect(() => validate({ shared: '' })).toThrow(/Dependency path cannot be empty/)
      expect(() => validate({ shared: '   ' })).toThrow(/Dependency path cannot be empty/)
    })

    it('should reject object instead of string (git sources are not supported)', ({ expect }) => {
      expect(() =>
        validate({
          shared: { git: 'https://github.com/acme/shared.git', ref: 'v1.0.0', path: 'model' },
        })
      ).toThrow(/Dependency path must be a relative path string/)
    })

    it.for([
      42,
      null,
      ['../shared'],
    ])('should reject non-string value %j', (value, { expect }) => {
      expect(() => validate({ shared: value })).toThrow(/Dependency path must be a relative path string/)
    })

    it('should reject non-object dependencies', ({ expect }) => {
      expect(() => validate('../shared')).toThrow()
      expect(() => validate(['../shared'])).toThrow()
    })
  })

  describe('names', () => {
    it('should accept names valid as project names', ({ expect }) => {
      const config = validate({
        'billing': '../billing',
        'billing-next': '../billing-next',
        'Billing_2': '../billing2',
      })
      expect(Object.keys(config.dependencies ?? {})).toEqual(['billing', 'billing-next', 'Billing_2'])
    })

    it.for([
      'shared.model',
      '@shared',
      'shared#1',
    ])('should reject name %s', (name, { expect }) => {
      expect(() => validate({ [name]: '../shared' })).toThrow(
        /Dependency name cannot contain "\.", "@" or "#", try to use A-z, 0-9, _ and -/,
      )
    })

    it('should reject name "default"', ({ expect }) => {
      expect(() => validate({ default: '../shared' })).toThrow(/Dependency name cannot be "default"/)
    })

    it('should reject empty name', ({ expect }) => {
      expect(() => validate({ '': '../shared' })).toThrow(/Dependency name cannot be empty/)
    })
  })

  describe('normalization', () => {
    it('should normalize separators, repeated and trailing slashes', ({ expect }) => {
      const config = validate({
        a: '..\\shared\\model\\',
        b: ' ../shared//model/ ',
        c: './',
        d: '.',
      })
      expect(config.dependencies).toEqual({
        a: '../shared/model',
        b: '../shared/model',
        c: '.',
        d: '.',
      })
    })

    it('LikeC4ProjectConfigOps.normalizeDependencies should normalize valid dependencies', ({ expect }) => {
      expect(LikeC4ProjectConfigOps.normalizeDependencies({ shared: '..\\shared\\' })).toEqual({
        shared: '../shared',
      })
    })

    it('LikeC4ProjectConfigOps.normalizeDependencies should return empty object for missing or invalid input', ({ expect }) => {
      expect(LikeC4ProjectConfigOps.normalizeDependencies(undefined)).toEqual({})
      expect(LikeC4ProjectConfigOps.normalizeDependencies({ shared: '/abs' })).toEqual({})
    })
  })

  describe('JSON schema', () => {
    it('should contain dependencies in the generated JSON schema', ({ expect }) => {
      const schema = z.toJSONSchema(LikeC4ProjectJsonConfigSchema, { unrepresentable: 'any', io: 'input' })
      expect(schema.$defs).toHaveProperty('DependenciesConfig')
    })

    it('should contain dependencies in packages/config/schema.json (generated by pnpm generate)', ({ expect }) => {
      const schemaJson = JSON.parse(readFileSync(resolve(import.meta.dirname, '../schema.json'), 'utf-8'))
      expect(schemaJson.$defs.LikeC4ProjectConfig.properties.dependencies).toEqual({
        $ref: '#/$defs/DependenciesConfig',
      })
      expect(schemaJson.$defs.DependenciesConfig).toMatchObject({
        type: 'object',
        additionalProperties: { type: 'string', minLength: 1 },
      })
    })
  })
})
