import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it } from 'vitest'
import z from 'zod/v4'
import { LikeC4ProjectConfigOps, LikeC4ProjectJsonConfigSchema, validateProjectConfig } from './schema'
import { GIT_DEFAULT_BRANCH_REF, isGitDependencySource } from './schema.dependencies'

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
      'http://github.com/acme/shared',
      'file:///models/shared',
      'git://github.com/acme/shared.git',
      'git+ssh://git@github.com/acme/shared.git',
    ])('should reject path with protocol %s naming the allowed git URLs', (path, { expect }) => {
      expect(() => validate({ shared: path })).toThrow(
        'Dependency path must be a relative path string (no protocol); a git dependency is a URL starting with https:// or ssh://',
      )
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
      'feature.lock/x',
      'feat#x',
      'ветка',
      'feat%20x',
      'a'.repeat(256),
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

  describe('git URL strings (shorthand)', () => {
    const shorthand = (value: string) => validate({ billing: value }).dependencies?.['billing']

    it.for(
      [
        ['https://github.com/my-org/billing.git', { git: 'https://github.com/my-org/billing.git', ref: 'HEAD' }],
        ['https://github.com/my-org/billing.git#v1.2.0', {
          git: 'https://github.com/my-org/billing.git',
          ref: 'v1.2.0',
        }],
        ['ssh://git@github.com/my-org/billing.git#main', {
          git: 'ssh://git@github.com/my-org/billing.git',
          ref: 'main',
        }],
        ['ssh://git@git.example.com:2222/my-org/billing.git', {
          git: 'ssh://git@git.example.com:2222/my-org/billing.git',
          ref: 'HEAD',
        }],
        ['HTTPS://github.com/my-org/billing.git#main', { git: 'HTTPS://github.com/my-org/billing.git', ref: 'main' }],
        // "#" separates the ref: "/" and ":" have no special meaning after it, a branch may contain "/"
        ['https://github.com/my-org/billing.git#release/1.0', {
          git: 'https://github.com/my-org/billing.git',
          ref: 'release/1.0',
        }],
        ['https://github.com/my-org/billing.git#0123456789abcdef0123456789abcdef01234567', {
          git: 'https://github.com/my-org/billing.git',
          ref: '0123456789abcdef0123456789abcdef01234567',
        }],
        [' https://github.com/my-org/billing.git #v1 ', { git: 'https://github.com/my-org/billing.git', ref: 'v1' }],
      ] as const,
    )('should transform %s to a git source', ([value, expected], { expect }) => {
      const source = shorthand(value)
      expect(source).toEqual(expected)
      expect(isGitDependencySource(source)).toBe(true)
    })

    it('should use the default branch (HEAD of the remote) without #ref', ({ expect }) => {
      expect(GIT_DEFAULT_BRANCH_REF).toBe('HEAD')
      expect(shorthand('https://github.com/my-org/billing.git')).toEqual({
        git: 'https://github.com/my-org/billing.git',
        ref: GIT_DEFAULT_BRANCH_REF,
      })
    })

    it('should be identical to the equivalent object form', ({ expect }) => {
      const config = validate({
        short: 'https://github.com/my-org/billing.git#main',
        object: { git: 'https://github.com/my-org/billing.git', ref: 'main' },
        shortDefault: 'ssh://git@github.com/my-org/billing.git',
        objectDefault: { git: 'ssh://git@github.com/my-org/billing.git', ref: 'HEAD' },
      })
      expect(config.dependencies?.['short']).toEqual(config.dependencies?.['object'])
      expect(config.dependencies?.['shortDefault']).toEqual(config.dependencies?.['objectDefault'])
    })

    it('should be transformed by LikeC4ProjectConfigOps.normalizeDependencies', ({ expect }) => {
      expect(
        LikeC4ProjectConfigOps.normalizeDependencies({
          shared: '../shared',
          billing: 'https://github.com/my-org/billing.git#v1',
        }),
      ).toEqual({
        shared: '../shared',
        billing: { git: 'https://github.com/my-org/billing.git', ref: 'v1' },
      })
    })

    it.for([
      'https://user:token@github.com/my-org/billing.git',
      'https://:ghp_token@github.com/my-org/billing.git#main',
      'ssh://git:secret@github.com/my-org/billing.git',
    ])('should reject credentials in %s', (value, { expect }) => {
      expect(() => shorthand(value)).toThrow(
        'Git dependency URL must not contain credentials, use a git credential helper or SSH keys instead',
      )
    })

    it.for([
      'https://',
      'https://github.com/my-org/billing.git?ref=main',
      'ssh://-oProxyCommand=evil/my-org/billing.git',
      'https://github.com/my-org/billing%2F..%2Fother.git#main',
      'https://github.com/my-org/../billing.git',
    ])('should reject malformed URL %s', (value, { expect }) => {
      expect(() => shorthand(value)).toThrow(
        'Git dependency URL must be https://host/org/repo.git or ssh://[user@]host[:port]/org/repo.git',
      )
    })

    it.for([
      'https://github.com/my-org/billing.git#a b',
      'https://github.com/my-org/billing.git#v1:architecture',
      'https://github.com/my-org/billing.git#-v1',
      'https://github.com/my-org/billing.git#main..dev',
      'https://github.com/my-org/billing.git#release/',
      'https://github.com/my-org/billing.git#main#x',
    ])('should validate the ref of %s as the ref of the object form', (value, { expect }) => {
      expect(() => shorthand(value)).toThrow(/Git dependency ref must be a branch, a tag or a commit SHA/)
      const ref = value.slice(value.indexOf('#') + 1)
      expect(() => validate({ billing: { git: 'https://github.com/my-org/billing.git', ref } })).toThrow(
        /Git dependency ref must be a branch, a tag or a commit SHA/,
      )
    })

    it.for([
      'https://github.com/my-org/billing.git#a#b',
      'https://github.com/my-org/billing.git#ветка',
      'https://github.com/my-org/billing.git#v1.lock',
    ])('should reject %s, as the installer would', (value, { expect }) => {
      expect(() => shorthand(value)).toThrow(/Git dependency ref must be a branch, a tag or a commit SHA/)
    })

    it.for([
      'https:\\github.com\\my-org\\billing.git',
      'https:\\\\github.com\\my-org\\billing.git',
      'https:/github.com/my-org/billing.git',
      'ssh:\\\\git@github.com\\my-org\\billing.git',
    ])('should report %j as a mistyped git URL', (value, { expect }) => {
      expect(() => shorthand(value)).toThrow(
        'Dependency looks like a git URL: write it as https://host/org/repo.git or ssh://host/org/repo.git',
      )
    })

    it.for([
      'a://b',
      'C://models',
    ])('should report one error for %s', (value, { expect }) => {
      const result = LikeC4ProjectJsonConfigSchema.safeParse({ name: 'consumer', dependencies: { shared: value } })
      expect(result.error?.issues.map(issue => issue.message)).toEqual([
        expect.stringMatching(/^Dependency path must be a relative path string \(no protocol\)/),
      ])
    })

    it('should reject empty ref after "#"', ({ expect }) => {
      expect(() => shorthand('https://github.com/my-org/billing.git#')).toThrow(
        'Git dependency ref after "#" cannot be empty, omit "#" to use the default branch',
      )
      expect(() => shorthand('https://github.com/my-org/billing.git#  ')).toThrow(
        'Git dependency ref after "#" cannot be empty',
      )
    })

    it.for([
      'http://github.com/my-org/billing.git',
      'file:///repos/billing.git',
      'git://github.com/my-org/billing.git',
    ])('should reject %s as a path, naming the allowed git URLs', (value, { expect }) => {
      expect(() => shorthand(value)).toThrow(
        'Dependency path must be a relative path string (no protocol); a git dependency is a URL starting with https:// or ssh://',
      )
    })

    it('should keep the scp-like form and other strings as local paths (as before)', ({ expect }) => {
      // The scp-like form is accepted only in the object form: a string without "://" is a path
      expect(validate({ billing: 'git@github.com:my-org/billing.git' }).dependencies).toEqual({
        billing: 'git@github.com:my-org/billing.git',
      })
      expect(validate({ shared: '../https-models', other: 'ssh/models' }).dependencies).toEqual({
        shared: '../https-models',
        other: 'ssh/models',
      })
    })

    it('should not accept path in the shorthand (only in the object form)', ({ expect }) => {
      expect(() => shorthand('https://github.com/my-org/billing.git#main:architecture')).toThrow(
        /Git dependency ref must be a branch, a tag or a commit SHA/,
      )
    })

    it('should report a generic error for values of other types', ({ expect }) => {
      expect(() => validate({ billing: 42 })).toThrow(
        'Dependency path must be a relative path string, a git URL "https://..." or "ssh://..." with an optional "#ref"',
      )
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
            { type: 'string', pattern: expect.any(String) },
            { $ref: '#/$defs/GitDependencySource' },
          ],
        },
      })
      // A string is either a relative path or a git URL starting with https:// or ssh://
      const [pathOption, shorthandOption] = schemaJson.$defs.DependenciesConfig.additionalProperties.anyOf
      const isPath = (value: string) => new RegExp(pathOption.pattern).test(value)
      const isShorthand = (value: string) => new RegExp(shorthandOption.pattern).test(value)
      for (const value of ['https://github.com/my-org/billing.git', 'ssh://git@github.com/my-org/billing.git#v1']) {
        expect(isShorthand(value), value).toBe(true)
        expect(isPath(value), value).toBe(false)
      }
      for (const value of ['../shared', 'libs/billing']) {
        expect(isShorthand(value), value).toBe(false)
        expect(isPath(value), value).toBe(true)
      }
      for (
        const value of [
          'http://github.com/my-org/billing.git',
          'file:///repos/billing.git',
          'https:/github.com/my-org/billing.git',
          'C:/models',
          '/models',
        ]
      ) {
        expect(isShorthand(value), value).toBe(false)
        expect(isPath(value), value).toBe(false)
      }
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
