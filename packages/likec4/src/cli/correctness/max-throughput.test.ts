import { describe, expect, it } from 'vitest'
import { checkMaxThroughput } from './max-throughput'

// Mock LikeC4 services
const mockLanguageServices = {
  workspace: '/test/workspace',
  langium: {
    shared: {
      workspace: {
        LangiumDocuments: {
          all: {
            toArray: () => [],
          },
        },
      },
    },
  },
} as any

describe('checkMaxThroughput', () => {
  it('should return no issues when all elements have required performance metadata', () => {
    const mockModel = {
      elements: () => [
        {
          id: 'test-element',
          kind: 'service',
          metadata: {
            'perf-serviceTime': '1000.0',
            'perf-replication': '2',
            'perf-maxUtilizationRate': '0.8',
          },
        },
      ],
    }

    const issues = checkMaxThroughput(mockModel, mockLanguageServices)
    expect(issues).toHaveLength(0)
  })

  it('should return issues when elements are missing performance metadata', () => {
    const mockModel = {
      elements: () => [
        {
          id: 'test-element',
          kind: 'service',
          metadata: {
            'perf-serviceTime': '1000.0',
            // Missing perf-replication and perf-maxUtilizationRate
          },
        },
      ],
    }

    const issues = checkMaxThroughput(mockModel, mockLanguageServices)
    expect(issues).toHaveLength(1)
    expect(issues[0]!.type).toBe('warning')
    expect(issues[0]!.category).toBe('PERF-METADATA')
    expect(issues[0]!.message).toContain('test-element')
    expect(issues[0]!.message).toContain('perf-replication')
    expect(issues[0]!.message).toContain('perf-maxUtilizationRate')
  })

  it('should return issues when elements have no metadata block', () => {
    const mockModel = {
      elements: () => [
        {
          id: 'test-element',
          kind: 'service',
          // No metadata at all
        },
      ],
    }

    const issues = checkMaxThroughput(mockModel, mockLanguageServices)
    expect(issues).toHaveLength(1)
    expect(issues[0]!.type).toBe('warning')
    expect(issues[0]!.category).toBe('PERF-METADATA')
    expect(issues[0]!.message).toContain('test-element')
    expect(issues[0]!.message).toContain('no metadata block')
  })

  it('should skip user and external elements', () => {
    const mockModel = {
      elements: () => [
        {
          id: 'user-element',
          kind: 'user',
          // No metadata, but should be skipped
        },
        {
          id: 'external-element',
          kind: 'external',
          // No metadata, but should be skipped
        },
      ],
    }

    const issues = checkMaxThroughput(mockModel, mockLanguageServices)
    expect(issues).toHaveLength(0)
  })

  it('should handle multiple elements with different issues', () => {
    const mockModel = {
      elements: () => [
        {
          id: 'complete-element',
          kind: 'service',
          metadata: {
            'perf-serviceTime': '1000.0',
            'perf-replication': '2',
            'perf-maxUtilizationRate': '0.8',
          },
        },
        {
          id: 'missing-props-element',
          kind: 'service',
          metadata: {
            'perf-serviceTime': '1000.0',
            // Missing other props
          },
        },
        {
          id: 'no-metadata-element',
          kind: 'service',
          // No metadata at all
        },
      ],
    }

    const issues = checkMaxThroughput(mockModel, mockLanguageServices)
    expect(issues).toHaveLength(2)

    const missingPropsIssue = issues.find(issue => issue.message.includes('missing-props-element'))
    const noMetadataIssue = issues.find(issue => issue.message.includes('no-metadata-element'))

    expect(missingPropsIssue).toBeDefined()
    expect(noMetadataIssue).toBeDefined()
    expect(missingPropsIssue!.message).toContain('missing required performance properties')
    expect(noMetadataIssue!.message).toContain('no metadata block')
  })
})
