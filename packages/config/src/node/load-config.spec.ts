import * as fs from 'node:fs/promises'
import { describe, expect, it, vi } from 'vitest'
import type { VscodeURI } from '../schema'
import { loadConfig } from './load-config'

vi.mock('node:fs/promises')

const mockVscodeURI = (fsPath: string): VscodeURI => ({
  scheme: 'file',
  authority: '',
  path: fsPath,
  fsPath,
  query: '',
  fragment: '',
  toString: () => `file://${fsPath}`,
})

describe('loadConfig - JSON branch', () => {
  describe('valid JSON config files', () => {
    it('should load .likec4rc with valid config', async () => {
      const filepath = mockVscodeURI('/project/.likec4rc')
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        name: 'test-project',
        title: 'Test Project',
      }))

      const config = await loadConfig(filepath)

      expect(config).toEqual({
        name: 'test-project',
        title: 'Test Project',
      })
      expect(fs.readFile).toHaveBeenCalledWith('/project/.likec4rc', 'utf-8')
    })
  })

  describe('implicit config from directory name', () => {
    it('should use directory name as implicit project name', async () => {
      const filepath = mockVscodeURI('/projects/my-awesome-app/.likec4rc')
      vi.mocked(fs.readFile).mockResolvedValue('{}')

      const config = await loadConfig(filepath)

      expect(config.name).toBe('my-awesome-app')
    })

    it('should override implicit name with explicit name from config', async () => {
      const filepath = mockVscodeURI('/projects/folder-name/.likec4rc')
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        name: 'explicit-name',
      }))

      const config = await loadConfig(filepath)

      expect(config.name).toBe('explicit-name')
    })
  })

  describe('JSON5 support', () => {
    it('should parse JSON5 with comments', async () => {
      const filepath = mockVscodeURI('/project/.likec4rc')
      vi.mocked(fs.readFile).mockResolvedValue(`{
        // This is a comment
        name: 'test-project',
        /* Multi-line
           comment */
        title: 'Test'
      }`)

      const config = await loadConfig(filepath)

      expect(config.name).toBe('test-project')
      expect(config.title).toBe('Test')
    })

    it('should parse JSON5 with trailing commas', async () => {
      const filepath = mockVscodeURI('/project/.likec4rc')
      vi.mocked(fs.readFile).mockResolvedValue(`{
        name: 'test-project',
        title: 'Test',
      }`)

      const config = await loadConfig(filepath)

      expect(config.name).toBe('test-project')
      expect(config.title).toBe('Test')
    })

    it('should parse JSON5 with unquoted keys', async () => {
      const filepath = mockVscodeURI('/project/.likec4rc')
      vi.mocked(fs.readFile).mockResolvedValue(`{
        name: 'test-project',
        contactPerson: 'Jane',
      }`)

      const config = await loadConfig(filepath)

      expect(config.name).toBe('test-project')
      expect(config.contactPerson).toBe('Jane')
    })
  })

  describe('empty and minimal configs', () => {
    const testCases = [
      { name: 'empty-file', content: '' },
      { name: 'empty-multiline-file', content: '\n\n' },
      { name: 'empty-json-object', content: '{ }' },
    ]
    it.each(testCases)('%o', async ({ name, content }) => {
      const filepath = mockVscodeURI(`/projects/${name}/.likec4rc`)
      vi.mocked(fs.readFile).mockResolvedValue(content)
      await expect(loadConfig(filepath)).resolves.toMatchObject({
        name,
      })
    })
  })

  describe('validation errors', () => {
    it('should throw on invalid JSON', async () => {
      const filepath = mockVscodeURI('/project/.likec4rc')
      vi.mocked(fs.readFile).mockResolvedValue('{ invalid json }')

      await expect(loadConfig(filepath)).rejects.toThrowErrorMatchingInlineSnapshot(
        `[SyntaxError: /project/.likec4rc: JSON5: invalid character 'j' at 1:11]`,
      )
    })
  })
})
