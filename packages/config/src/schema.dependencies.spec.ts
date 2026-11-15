import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it } from 'vitest'
import z from 'zod/v4'
import { LikeC4ProjectConfigOps, LikeC4ProjectJsonConfigSchema, validateProjectConfig } from './schema'
import { isGitDependencySource } from './schema.dependencies'

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

    it.for([
      42,
      null,
      ['../shared'],
    ])('should reject value that is neither a path nor a git source %j', (value, { expect }) => {
      expect(() => validate({ shared: value })).toThrow(/Dependency path must be a relative path string/)
    })

    it('should reject non-object dependencies', ({ expect }) => {
      expect(() => validate('../shared')).toThrow()
      expect(() => validate(['../shared'])).toThrow()
    })
  })

  describe('git sources', () => {
    const git = (source: Record<string, unknown>) => validate({ billing: source }).dependencies?.['billing']

    it.for([
      'https://github.com/my-org/billing.git',
      'ssh://git@github.com/my-org/billing.git',
      'ssh://git@git.example.com:2222/my-org/billing.git',
      'git@github.com:my-org/billing.git',
    ])('should accept allowed URL %s', (url, { expect }) => {
      expect(git({ git: url, ref: 'v1.2.0' })).toEqual({ git: url, ref: 'v1.2.0' })
    })

    it('should accept a git source together with local paths', ({ expect }) => {
      const config = validate({
        shared: '../shared-model',
        billing: { git: 'git@github.com:my-org/billing.git', ref: 'main', path: 'architecture' },
      })
      expect(config.dependencies).toEqual({
        shared: '../shared-model',
        billing: { git: 'git@github.com:my-org/billing.git', ref: 'main', path: 'architecture' },
      })
    })

    it.for([
      'http://github.com/my-org/billing.git',
      'file:///repos/billing.git',
      'git://github.com/my-org/billing.git',
      'ext::sh -c touch% /tmp/pwned',
      'git+ssh://git@github.com/my-org/billing.git',
      '../billing',
      '/repos/billing.git',
      'ssh://-oProxyCommand=evil/my-org/billing.git',
      'https://github.com/my-org/billing%2F..%2Fother.git',
    ])('should reject URL %s naming the allowed forms', (url, { expect }) => {
      expect(() => git({ git: url, ref: 'v1' })).toThrow(
        'Git dependency URL must use https://, ssh:// or git@host:org/repo.git',
      )
    })

    it.for([
      'https://user:token@github.com/my-org/billing.git',
      'https://:ghp_token@github.com/my-org/billing.git',
      'ssh://git:secret@github.com/my-org/billing.git',
    ])('should reject URL with credentials %s', (url, { expect }) => {
      expect(() => git({ git: url, ref: 'v1' })).toThrow(
        'Git dependency URL must not contain credentials, use a git credential helper or SSH keys instead',
      )
    })

    it.for([
      'https://user@github.com/my-org/billing.git',
      'ssh://git@github.com/my-org/billing.git',
      'git@github.com:my-org/billing.git',
      'github.com:my-org/billing.git',
    ])('should accept URL with a user name only %s', (url, { expect }) => {
      expect(git({ git: url, ref: 'v1' })).toEqual({ git: url, ref: 'v1' })
    })

    it('should reject empty URL', ({ expect }) => {
      expect(() => git({ git: '', ref: 'v1' })).toThrow(/Git dependency URL cannot be empty/)
      expect(() => git({ git: '   ', ref: 'v1' })).toThrow(/Git dependency URL cannot be empty/)
    })

    it('should reject missing URL', ({ expect }) => {
      expect(() => git({ ref: 'v1' })).toThrow(/Git dependency URL is required/)
    })

    it('should reject git source without ref', ({ expect }) => {
      expect(() => git({ git: 'git@github.com:my-org/billing.git' })).toThrow(/Git dependency ref is required/)
      expect(() => git({ git: 'git@github.com:my-org/billing.git', path: 'architecture' })).toThrow(
        /Git dependency ref is required/,
      )
    })

    it('should reject empty ref', ({ expect }) => {
      expect(() => git({ git: 'git@github.com:my-org/billing.git', ref: '' })).toThrow(
        /Git dependency ref cannot be empty/,
      )
      expect(() => git({ git: 'git@github.com:my-org/billing.git', ref: '  ' })).toThrow(
        /Git dependency ref cannot be empty/,
      )
    })

    it.for([
      'main',
      'v1.2.0',
      'feature/billing-api',
      'release/2026.11',
      'refs/tags/v1.2.0',
      '0123456789abcdef0123456789abcdef01234567',
      'f'.repeat(64),
      'v1@2',
    ])('should accept ref %s', (ref, { expect }) => {
      expect(git({ git: 'git@github.com:my-org/billing.git', ref })).toEqual({
        git: 'git@github.com:my-org/billing.git',
        ref,
      })
    })

    it.for([
      '--upload-pack=evil',
      '-b',
      'feature branch',
      'v1\n2',
      'main:refs/heads/evil',
      'v1..v2',
      'main~1',
      'main^',
      'feat?',
      'feat*',
      'feat[1]',
      'feat\\x',
      'main@{1}',
      '@',
      'feature.lock',
      'feature/',
      '/feature',
      'feature//x',
      'feature.',
      '.hidden',
      'feature/.hidden',
    ])('should reject ref %j', (ref, { expect }) => {
      expect(() => git({ git: 'git@github.com:my-org/billing.git', ref })).toThrow(
        /Git dependency ref must be a branch, a tag or a commit SHA/,
      )
    })

    it.for([
      '..',
      '../other',
      'architecture/../../other',
      'architecture\\..\\..\\other',
    ])('should reject path with ".." segment %s', (path, { expect }) => {
      expect(() => git({ git: 'git@github.com:my-org/billing.git', ref: 'v1', path })).toThrow(
        /Git dependency path must stay inside the repository/,
      )
    })

    it.for([
      '/architecture',
      '\\architecture',
      '\\\\server\\share',
      'C:\\architecture',
      'c:/architecture',
      'C:architecture',
      'https://example.com/architecture',
    ])('should reject absolute path %s', (path, { expect }) => {
      expect(() => git({ git: 'git@github.com:my-org/billing.git', ref: 'v1', path })).toThrow(
        /Git dependency path must be a relative path inside the repository/,
      )
    })

    it('should reject empty path', ({ expect }) => {
      expect(() => git({ git: 'git@github.com:my-org/billing.git', ref: 'v1', path: '' })).toThrow(
        /Git dependency path cannot be empty/,
      )
    })

    it('should reject unknown fields', ({ expect }) => {
      expect(() => git({ git: 'git@github.com:my-org/billing.git', ref: 'v1', branch: 'main' })).toThrow(
        /Unrecognized key: "branch"/,
      )
    })

    it.for([
      { git: 42, ref: 'v1' },
      { git: 'git@github.com:my-org/billing.git', ref: 1 },
      { git: 'git@github.com:my-org/billing.git', ref: 'v1', path: 1 },
    ])('should reject fields of wrong type %j', (source, { expect }) => {
      expect(() => git(source)).toThrow(/Git dependency/)
    })

    it('should normalize URL, ref and path', ({ expect }) => {
      expect(git({ git: ' git@github.com:my-org/billing.git ', ref: ' v1 ', path: ' .\\architecture\\\\model\\ ' }))
        .toEqual({ git: 'git@github.com:my-org/billing.git', ref: 'v1', path: './architecture/model' })
    })

    it('LikeC4ProjectConfigOps.normalizeDependencies should pass git sources through with normalized path', ({ expect }) => {
      expect(
        LikeC4ProjectConfigOps.normalizeDependencies({
          shared: '..\\shared\\',
          billing: { git: 'git@github.com:my-org/billing.git', ref: 'v1', path: 'architecture\\' },
        }),
      ).toEqual({
        shared: '../shared',
        billing: { git: 'git@github.com:my-org/billing.git', ref: 'v1', path: 'architecture' },
      })
    })

    it('LikeC4ProjectConfigOps.normalizeDependencies should return empty object for invalid git source', ({ expect }) => {
      expect(
        LikeC4ProjectConfigOps.normalizeDependencies({
          billing: { git: 'file:///repos/billing.git', ref: 'v1' },
        }),
      ).toEqual({})
    })

    it('isGitDependencySource should distinguish git sources from paths', ({ expect }) => {
      const config = validate({
        shared: '../shared-model',
        billing: { git: 'git@github.com:my-org/billing.git', ref: 'v1' },
      })
      expect(isGitDependencySource(config.dependencies?.['shared'])).toBe(false)
      expect(isGitDependencySource(config.dependencies?.['billing'])).toBe(true)
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
        additionalProperties: {
          anyOf: [
            { type: 'string', minLength: 1 },
            { $ref: '#/$defs/GitDependencySource' },
          ],
        },
      })
      expect(schemaJson.$defs.GitDependencySource).toMatchObject({
        type: 'object',
        properties: {
          git: { type: 'string', minLength: 1, pattern: expect.any(String) },
          ref: { type: 'string', minLength: 1 },
          path: { type: 'string', minLength: 1 },
        },
        required: ['git', 'ref'],
        additionalProperties: false,
      })
      // The coarse pattern of the URL flags obvious mistakes in editors
      const pattern = new RegExp(schemaJson.$defs.GitDependencySource.properties.git.pattern)
      expect(pattern.test('git@github.com:my-org/billing.git')).toBe(true)
      expect(pattern.test('github.com:my-org/billing.git')).toBe(true)
      expect(pattern.test('https://github.com/my-org/billing.git')).toBe(true)
      expect(pattern.test('ssh://git@github.com/my-org/billing.git')).toBe(true)
      expect(pattern.test('http://github.com/my-org/billing.git')).toBe(false)
      expect(pattern.test('file:///repos/billing.git')).toBe(false)
      expect(pattern.test('git://github.com/my-org/billing.git')).toBe(false)
      expect(pattern.test('ext::sh -c evil')).toBe(false)
    })
  })
})
