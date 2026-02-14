// oxlint-disable typescript/no-base-to-string
import * as fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from './load-config';
vi.mock('node:fs/promises');
const mockVscodeURI = (fsPath) => ({
    scheme: 'file',
    authority: '',
    path: fsPath,
    fsPath,
    query: '',
    fragment: '',
    toString: () => `file://${fsPath}`,
});
const normalizePath = (path) => resolve(path);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mockFsReads = (entries) => {
    const files = new Map();
    for (const [filepath, value] of Object.entries(entries)) {
        const content = typeof value === 'string' ? value : JSON.stringify(value);
        files.set(normalizePath(filepath), content);
    }
    vi.mocked(fs.readFile).mockImplementation(async (path) => {
        const key = normalizePath(typeof path === 'string' ? path : path.toString());
        const content = files.get(key);
        if (content === undefined) {
            throw new Error(`ENOENT: no such file or directory, open '${key}'`);
        }
        return content;
    });
};
describe('loadConfig - JSON branch', () => {
    describe('valid JSON config files', () => {
        it('should load .likec4rc with valid config', async () => {
            const filepath = mockVscodeURI('/project/.likec4rc');
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
                name: 'test-project',
                title: 'Test Project',
            }));
            const config = await loadConfig(filepath);
            expect(config).toEqual({
                name: 'test-project',
                title: 'Test Project',
            });
            expect(fs.readFile).toHaveBeenCalledWith(normalizePath(filepath.fsPath), 'utf-8');
        });
    });
    describe('implicit config from directory name', () => {
        it('should use directory name as implicit project name', async () => {
            const filepath = mockVscodeURI('/projects/my-awesome-app/.likec4rc');
            vi.mocked(fs.readFile).mockResolvedValue('{}');
            const config = await loadConfig(filepath);
            expect(config.name).toBe('my-awesome-app');
        });
        it('should override implicit name with explicit name from config', async () => {
            const filepath = mockVscodeURI('/projects/folder-name/.likec4rc');
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
                name: 'explicit-name',
            }));
            const config = await loadConfig(filepath);
            expect(config.name).toBe('explicit-name');
        });
    });
    describe('JSON5 support', () => {
        it('should parse JSON5 with comments', async () => {
            const filepath = mockVscodeURI('/project/.likec4rc');
            vi.mocked(fs.readFile).mockResolvedValue(`{
        // This is a comment
        name: 'test-project',
        /* Multi-line
           comment */
        title: 'Test'
      }`);
            const config = await loadConfig(filepath);
            expect(config.name).toBe('test-project');
            expect(config.title).toBe('Test');
        });
        it('should parse JSON5 with trailing commas', async () => {
            const filepath = mockVscodeURI('/project/.likec4rc');
            vi.mocked(fs.readFile).mockResolvedValue(`{
        name: 'test-project',
        title: 'Test',
      }`);
            const config = await loadConfig(filepath);
            expect(config.name).toBe('test-project');
            expect(config.title).toBe('Test');
        });
        it('should parse JSON5 with unquoted keys', async () => {
            const filepath = mockVscodeURI('/project/.likec4rc');
            vi.mocked(fs.readFile).mockResolvedValue(`{
        name: 'test-project',
        contactPerson: 'Jane',
      }`);
            const config = await loadConfig(filepath);
            expect(config.name).toBe('test-project');
            expect(config.contactPerson).toBe('Jane');
        });
    });
    describe('extends support', () => {
        it('should merge styles from extended configs', async () => {
            const filepath = mockVscodeURI('/project/.likec4rc');
            mockFsReads({
                '/project/.likec4rc': {
                    name: 'root',
                    extends: './base.json',
                    styles: {
                        defaults: {
                            color: 'main',
                            relationship: {
                                arrow: 'vee',
                            },
                        },
                    },
                },
                '/project/base.json': {
                    name: 'base',
                    styles: {
                        defaults: {
                            color: 'base',
                            relationship: {
                                line: 'dashed',
                            },
                        },
                    },
                },
            });
            const config = await loadConfig(filepath);
            expect(config).toMatchObject({
                name: 'root',
                styles: {
                    defaults: {
                        color: 'main',
                        relationship: {
                            line: 'dashed',
                            arrow: 'vee',
                        },
                    },
                },
            });
        });
        it('should respect extends order when merging styles', async () => {
            const filepath = mockVscodeURI('/project/.likec4rc');
            mockFsReads({
                '/project/.likec4rc': {
                    name: 'root',
                    extends: ['./base.json', './override.json'],
                },
                '/project/base.json': {
                    name: 'base',
                    styles: {
                        defaults: {
                            color: 'primary',
                        },
                    },
                },
                '/project/override.json': {
                    name: 'override',
                    styles: {
                        defaults: {
                            color: 'secondary',
                        },
                    },
                },
            });
            const config = await loadConfig(filepath);
            expect(config).toMatchObject({
                name: 'root',
                styles: {
                    defaults: {
                        color: 'secondary',
                    },
                },
            });
        });
        it('should detect extends cycles', async () => {
            const filepath = mockVscodeURI('/project/.likec4rc');
            mockFsReads({
                '/project/.likec4rc': {
                    name: 'root',
                    extends: './base.json',
                },
                '/project/base.json': {
                    name: 'base',
                    extends: './.likec4rc',
                },
            });
            await expect(loadConfig(filepath)).rejects.toThrow('Config extends cycle detected');
        });
        it('should resolve extends across folders', async () => {
            const filepath = mockVscodeURI('/project/config/.likec4rc');
            mockFsReads({
                '/project/config/.likec4rc': {
                    name: 'root',
                    extends: '../shared/base.json',
                    styles: {
                        defaults: {
                            relationship: {
                                line: 'dashed',
                            },
                        },
                    },
                },
                '/project/shared/base.json': {
                    name: 'base',
                    styles: {
                        defaults: {
                            relationship: {
                                arrow: 'normal',
                            },
                        },
                    },
                },
            });
            const config = await loadConfig(filepath);
            expect(config).toMatchObject({
                name: 'root',
                styles: {
                    defaults: {
                        relationship: {
                            line: 'dashed',
                            arrow: 'normal',
                        },
                    },
                },
            });
        });
        it('should resolve nested extends relative to each config', async () => {
            const filepath = mockVscodeURI('/project/config/.likec4rc');
            mockFsReads({
                '/project/config/.likec4rc': {
                    name: 'root',
                    extends: '../shared/base.json',
                    styles: {
                        defaults: {
                            relationship: {
                                arrow: 'vee',
                            },
                        },
                    },
                },
                '/project/shared/base.json': {
                    name: 'base',
                    extends: '../themes/theme.json',
                    styles: {
                        defaults: {
                            relationship: {
                                line: 'dotted',
                            },
                        },
                    },
                },
                '/project/themes/theme.json': {
                    name: 'theme',
                    styles: {
                        defaults: {
                            relationship: {
                                color: 'primary',
                            },
                        },
                    },
                },
            });
            const config = await loadConfig(filepath);
            expect(config).toMatchObject({
                name: 'root',
                styles: {
                    defaults: {
                        relationship: {
                            color: 'primary',
                            line: 'dotted',
                            arrow: 'vee',
                        },
                    },
                },
            });
        });
    });
    describe('empty and minimal configs', () => {
        const testCases = [
            { name: 'empty-file', content: '' },
            { name: 'empty-multiline-file', content: '\n\n' },
            { name: 'empty-json-object', content: '{ }' },
        ];
        it.each(testCases)('%o', async ({ name, content }) => {
            const filepath = mockVscodeURI(`/projects/${name}/.likec4rc`);
            vi.mocked(fs.readFile).mockResolvedValue(content);
            await expect(loadConfig(filepath)).resolves.toMatchObject({
                name,
            });
        });
    });
    describe('validation errors', () => {
        it('should throw on invalid JSON', async () => {
            const filepath = mockVscodeURI('/project/.likec4rc');
            vi.mocked(fs.readFile).mockResolvedValue('{ invalid json }');
            const expectedPath = escapeRegExp(normalizePath(filepath.fsPath));
            await expect(loadConfig(filepath)).rejects.toThrowError(new RegExp(`${expectedPath}: JSON5: invalid character 'j' at 1:11`));
        });
    });
});
