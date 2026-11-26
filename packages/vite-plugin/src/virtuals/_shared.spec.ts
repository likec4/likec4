import type { ProjectId } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { indexByName, parseModuleId, toVirtualId } from './_shared'

const projectA = 'project-a' as ProjectId

describe('virtual module ids', () => {
  it('builds resolved ids', () => {
    expect(toVirtualId('model')).toBe('\0likec4:model.js')
    expect(toVirtualId('model', projectA)).toBe('\0likec4:model/project-a.js')
  })

  it('parses public ids', () => {
    expect(parseModuleId('likec4:model')).toEqual({ name: 'model', projectId: null })
    expect(parseModuleId('likec4:model/project-a')).toEqual({ name: 'model', projectId: 'project-a' })
    expect(parseModuleId('likec4:react/project.with.dots')).toEqual({ name: 'react', projectId: 'project.with.dots' })
  })

  it('parses resolved ids', () => {
    expect(parseModuleId(toVirtualId('model'))).toEqual({ name: 'model', projectId: null })
    expect(parseModuleId(toVirtualId('icons', projectA))).toEqual({ name: 'icons', projectId: 'project-a' })
  })

  it('rejects foreign and malformed ids', () => {
    expect(parseModuleId('react')).toBeNull()
    expect(parseModuleId('virtual:likec4/model')).toBeNull()
    expect(parseModuleId('likec4:')).toBeNull()
    expect(parseModuleId('likec4:model/')).toBeNull()
    expect(parseModuleId('likec4:/project-a')).toBeNull()
  })
})

describe('indexByName', () => {
  it('throws on duplicate names', () => {
    expect(() => indexByName([{ name: 'model' }, { name: 'model' }])).toThrow('Duplicate LikeC4 virtual module: model')
  })
})
