import { describe, it } from 'vitest';
import { validateProjectConfig as validateConfig } from './schema';
import { ImageAliasesSchema } from './schema.image-alias';
describe('ProjectConfig schema', () => {
    describe('validateProjectConfig', () => {
        describe('name field', () => {
            it('should accept valid project names', ({ expect }) => {
                const validConfigs = [
                    { name: 'my-project' },
                    { name: 'project123' },
                    { name: 'my_project' },
                    { name: 'Project-Name_123' },
                ];
                for (const config of validConfigs) {
                    expect(() => validateConfig(config)).not.toThrow();
                    const result = validateConfig(config);
                    expect(result.name).toBe(config.name);
                }
            });
            it('should reject empty name', ({ expect }) => {
                expect(() => validateConfig({ name: '' })).toThrow('Project name cannot be empty');
            });
            it('should reject name "default"', ({ expect }) => {
                expect(() => validateConfig({ name: 'default' })).toThrow(/Project name cannot be "default"/);
            });
            it('should reject names containing dots', ({ expect }) => {
                expect(() => validateConfig({ name: 'my.project' })).toThrow(/Project name cannot contain "\.", "@" or "#", try to use A-z, 0-9, _ and -/);
            });
            it('should reject names containing @ symbol', ({ expect }) => {
                expect(() => validateConfig({ name: 'my@project' })).toThrow(/Project name cannot contain "\.", "@" or "#", try to use A-z, 0-9, _ and -/);
            });
            it('should reject names containing # symbol', ({ expect }) => {
                expect(() => validateConfig({ name: 'my#project' })).toThrow(/Project name cannot contain "\.", "@" or "#", try to use A-z, 0-9, _ and -/);
            });
            it('should require name field', ({ expect }) => {
                expect(() => validateConfig({})).toThrow();
            });
        });
        describe('optional fields', () => {
            it('should accept valid title', ({ expect }) => {
                const config = { name: 'test', title: 'My Test Project' };
                const result = validateConfig(config);
                expect(result.title).toBe('My Test Project');
            });
            it('should reject empty title when provided', ({ expect }) => {
                expect(() => validateConfig({ name: 'test', title: '' })).toThrow('Project title cannot be empty if specified');
            });
            it('should accept valid contactPerson', ({ expect }) => {
                const config = { name: 'test', contactPerson: 'John Doe' };
                const result = validateConfig(config);
                expect(result.contactPerson).toBe('John Doe');
            });
            it('should reject empty contactPerson when provided', ({ expect }) => {
                expect(() => validateConfig({ name: 'test', contactPerson: '' })).toThrow('Contact person cannot be empty if specified');
            });
            it('should accept valid exclude array', ({ expect }) => {
                const config = { name: 'test', exclude: ['**/node_modules/**', '**/dist/**'] };
                const result = validateConfig(config);
                expect(result.exclude).toEqual(['**/node_modules/**', '**/dist/**']);
            });
        });
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
                ];
                for (const config of validConfigs) {
                    expect(() => {
                        const result = validateConfig(config);
                        expect(result.imageAliases).toEqual(config.imageAliases);
                    }).not.toThrow();
                }
            });
            it('should reject keys not starting with @', ({ expect }) => {
                const config = {
                    name: 'test',
                    imageAliases: {
                        'icons': './images', // Missing @
                    },
                };
                expect(() => validateConfig(config)).toThrow(`→ at imageAliases.icons`);
            });
            it('should reject keys with invalid characters', ({ expect }) => {
                const invalidKeys = ['@icons.old', '@icons/sub', '@icons space', '@icons+new'];
                for (const key of invalidKeys) {
                    const config = {
                        name: 'test',
                        imageAliases: { [key]: './images' },
                    };
                    expect(() => validateConfig(config), `Key "${key}" should be rejected`).toThrow(`→ at imageAliases["${key}"]`);
                }
            });
            it('should reject absolute paths as values', ({ expect }) => {
                const absolutePaths = ['/absolute/path', 'C:\\absolute\\path'];
                for (const path of absolutePaths) {
                    const config = {
                        name: 'test',
                        imageAliases: { '@icons': path },
                    };
                    expect(() => validateConfig(config), `Path "${path}" should be rejected`).toThrow('Image alias value must be a relative path (no leading slash or protocol)');
                }
            });
            it('should reject URLs as values', ({ expect }) => {
                const urls = ['http://example.com/images', 'https://cdn.example.com/assets', 'file://local/path'];
                for (const url of urls) {
                    const config = {
                        name: 'test',
                        imageAliases: { '@icons': url },
                    };
                    expect(() => validateConfig(config), `URL "${url}" should be rejected`).toThrow('Image alias value must be a relative path (no leading slash or protocol)');
                }
            });
            it('should reject empty values', ({ expect }) => {
                const config = {
                    name: 'test',
                    imageAliases: { '@icons': '' },
                };
                expect(() => validateConfig(config)).toThrow('Image alias value cannot be empty');
            });
            it('should accept relative paths', ({ expect }) => {
                const relativePaths = ['./images', '../assets', 'images/icons', 'nested/folder/path'];
                for (const path of relativePaths) {
                    const config = {
                        name: 'test',
                        imageAliases: { '@icons': path },
                    };
                    expect(() => validateConfig(config), `Path "${path}" should be accepted`).not.toThrow();
                }
            });
        });
        describe('include field', () => {
            it('should accept valid include paths', ({ expect }) => {
                const validConfigs = [
                    {
                        name: 'test',
                        include: { paths: ['../shared'] },
                    },
                    {
                        name: 'test',
                        include: { paths: ['../shared', '../common/specs'] },
                    },
                    {
                        name: 'test',
                        include: { paths: ['./local-shared', '../parent/shared'] },
                    },
                    {
                        name: 'test',
                        include: { paths: ['relative/path/to/shared'] },
                    },
                ];
                for (const config of validConfigs) {
                    expect(() => validateConfig(config)).not.toThrow();
                    const result = validateConfig(config);
                    expect(result.include).toMatchObject(config.include);
                }
            });
            it('should not reject empty include paths array', ({ expect }) => {
                const config = { name: 'test', include: { paths: [] } };
                expect(() => validateConfig(config)).not.toThrow();
            });
            it('should accept undefined include', ({ expect }) => {
                const config = { name: 'test' };
                const result = validateConfig(config);
                expect(result.include).toBeUndefined();
            });
            it('should reject absolute paths in include', ({ expect }) => {
                const absolutePaths = ['/absolute/path', 'C:\\absolute\\path', 'D:/another/path'];
                for (const path of absolutePaths) {
                    const config = {
                        name: 'test',
                        include: { paths: [path] },
                    };
                    expect(() => validateConfig(config), `Path "${path}" should be rejected`).toThrow('Include path must be a relative path (no leading slash, drive letter, or protocol)');
                }
            });
            it('should reject URLs in include', ({ expect }) => {
                const urls = ['http://example.com/shared', 'https://cdn.example.com/specs', 'file://local/path'];
                for (const url of urls) {
                    const config = {
                        name: 'test',
                        include: { paths: [url] },
                    };
                    expect(() => validateConfig(config), `URL "${url}" should be rejected`).toThrow('Include path must be a relative path (no leading slash, drive letter, or protocol)');
                }
            });
            it('should reject empty strings in include array', ({ expect }) => {
                const config = {
                    name: 'test',
                    include: { paths: [''] },
                };
                expect(() => validateConfig(config)).toThrow('Include path cannot be empty');
            });
            it('should reject mixed valid and invalid paths', ({ expect }) => {
                const config = {
                    name: 'test',
                    include: { paths: ['../shared', '/absolute/path'] },
                };
                expect(() => validateConfig(config)).toThrow('Include path must be a relative path (no leading slash, drive letter, or protocol)');
            });
        });
    });
    describe('ImageAliasesSchema', () => {
        describe('validation with zod', () => {
            it('should accept valid image aliases object', ({ expect }) => {
                const validAliases = {
                    '@icons': './images/icons',
                    '@brand': '../assets/brand',
                    '@': './images',
                    '@my-images': 'relative/path',
                    '@icons_2': './nested/folder/path',
                    '@test-alias': 'some/path',
                };
                expect(() => ImageAliasesSchema.parse(validAliases)).not.toThrow();
                const result = ImageAliasesSchema.parse(validAliases);
                expect(result).toEqual(validAliases);
            });
            it('should reject empty values', ({ expect }) => {
                const aliasesWithEmptyValue = { '@icons': '' };
                expect(() => ImageAliasesSchema.parse(aliasesWithEmptyValue)).toThrow('Image alias value cannot be empty');
            });
            it('should reject absolute paths', ({ expect }) => {
                const absolutePaths = [
                    { '@icons': '/absolute/path' },
                    { '@brand': 'C:\\absolute\\path' },
                    { '@assets': 'D:/another/absolute/path' },
                ];
                for (const aliases of absolutePaths) {
                    expect(() => ImageAliasesSchema.parse(aliases), `Should reject ${Object.values(aliases)[0]}`).toThrow('Image alias value must be a relative path (no leading slash or protocol)');
                }
            });
            it('should reject URLs', ({ expect }) => {
                const urlPaths = [
                    { '@icons': 'http://example.com/images' },
                    { '@brand': 'https://cdn.example.com/assets' },
                    { '@assets': 'file://local/path' },
                    { '@ftp': 'ftp://server.com/files' },
                ];
                for (const aliases of urlPaths) {
                    expect(() => ImageAliasesSchema.parse(aliases), `Should reject ${Object.values(aliases)[0]}`).toThrow('Image alias value must be a relative path (no leading slash or protocol)');
                }
            });
            it('should accept relative paths', ({ expect }) => {
                const relativePaths = [
                    { '@icons': './images' },
                    { '@brand': '../assets' },
                    { '@nested': 'images/icons' },
                    { '@deep': 'very/deep/nested/folder/path' },
                    { '@current': '.' },
                    { '@parent': '..' },
                ];
                for (const aliases of relativePaths) {
                    expect(() => ImageAliasesSchema.parse(aliases), `Should accept ${Object.values(aliases)[0]}`).not.toThrow();
                    const result = ImageAliasesSchema.parse(aliases);
                    expect(result).toEqual(aliases);
                }
            });
        });
    });
});
