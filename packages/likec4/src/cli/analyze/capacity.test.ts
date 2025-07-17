import { describe, expect, it } from 'vitest'
import { analyzeCapacity } from './capacity'

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

describe('analyzeCapacity', () => {
  it('should calculate capacity correctly for valid metadata', () => {
    const mockElement = {
      id: 'test-service',
      name: 'Test Service',
      kind: 'service',
      metadata: {
        'perf-serviceTime': '3000.0',
        'perf-replication': '2',
        'perf-maxUtilizationRate': '0.75',
      },
    }

    const result = analyzeCapacity(mockElement, mockLanguageServices)

    expect(result).toBeDefined()
    expect(result!.elementId).toBe('test-service')
    expect(result!.elementName).toBe('Test Service')
    expect(result!.elementKind).toBe('service')
    expect(result!.serviceTimeMs).toBe(3000.0)
    expect(result!.serviceTimeSeconds).toBe(3.0)
    expect(result!.replication).toBe(2)
    expect(result!.maxUtilizationRate).toBe(0.75)

    // Verify the formula: λ_max = (m × ρ*) / S
    // λ_max = (2 × 0.75) / 3.0 = 1.5 / 3.0 = 0.5
    expect(result!.maxArrivalRate).toBe(0.5)
  })

  it('should handle different service times correctly', () => {
    const testCases = [
      { serviceTime: '1000.0', replication: '1', utilization: '0.6', expected: 0.6 },
      { serviceTime: '2000.0', replication: '2', utilization: '0.8', expected: 0.8 },
      { serviceTime: '500.0', replication: '3', utilization: '0.9', expected: 5.4 },
      { serviceTime: '10000.0', replication: '1', utilization: '0.5', expected: 0.05 },
    ]

    testCases.forEach(({ serviceTime, replication, utilization, expected }) => {
      const mockElement = {
        id: 'test-service',
        name: 'Test Service',
        kind: 'service',
        metadata: {
          'perf-serviceTime': serviceTime,
          'perf-replication': replication,
          'perf-maxUtilizationRate': utilization,
        },
      }

      const result = analyzeCapacity(mockElement, mockLanguageServices)
      expect(result).toBeDefined()
      expect(result!.maxArrivalRate).toBeCloseTo(expected, 3)
    })
  })

  it('should return null for elements without metadata', () => {
    const mockElement = {
      id: 'test-service',
      name: 'Test Service',
      kind: 'service',
      // No metadata
    }

    const result = analyzeCapacity(mockElement, mockLanguageServices)
    expect(result).toBeNull()
  })

  it('should return null for elements with incomplete metadata', () => {
    const mockElement = {
      id: 'test-service',
      name: 'Test Service',
      kind: 'service',
      metadata: {
        'perf-serviceTime': '1000.0',
        // Missing perf-replication and perf-maxUtilizationRate
      },
    }

    const result = analyzeCapacity(mockElement, mockLanguageServices)
    expect(result).toBeNull()
  })

  it('should return null for invalid service time', () => {
    const mockElement = {
      id: 'test-service',
      name: 'Test Service',
      kind: 'service',
      metadata: {
        'perf-serviceTime': 'invalid',
        'perf-replication': '2',
        'perf-maxUtilizationRate': '0.75',
      },
    }

    const result = analyzeCapacity(mockElement, mockLanguageServices)
    expect(result).toBeNull()
  })

  it('should return null for invalid replication', () => {
    const mockElement = {
      id: 'test-service',
      name: 'Test Service',
      kind: 'service',
      metadata: {
        'perf-serviceTime': '1000.0',
        'perf-replication': 'invalid',
        'perf-maxUtilizationRate': '0.75',
      },
    }

    const result = analyzeCapacity(mockElement, mockLanguageServices)
    expect(result).toBeNull()
  })

  it('should return null for invalid utilization rate', () => {
    const testCases = [
      { utilization: 'invalid' },
      { utilization: '1.5' }, // > 1
      { utilization: '0' }, // <= 0
      { utilization: '-0.1' }, // < 0
    ]

    testCases.forEach(({ utilization }) => {
      const mockElement = {
        id: 'test-service',
        name: 'Test Service',
        kind: 'service',
        metadata: {
          'perf-serviceTime': '1000.0',
          'perf-replication': '2',
          'perf-maxUtilizationRate': utilization,
        },
      }

      const result = analyzeCapacity(mockElement, mockLanguageServices)
      expect(result).toBeNull()
    })
  })

  it('should handle edge cases correctly', () => {
    // Very small service time
    const mockElement1 = {
      id: 'fast-service',
      name: 'Fast Service',
      kind: 'service',
      metadata: {
        'perf-serviceTime': '1.0',
        'perf-replication': '1',
        'perf-maxUtilizationRate': '0.5',
      },
    }

    const result1 = analyzeCapacity(mockElement1, mockLanguageServices)
    expect(result1).toBeDefined()
    expect(result1!.maxArrivalRate).toBe(500) // (1 × 0.5) / 0.001 = 500

    // Very large service time
    const mockElement2 = {
      id: 'slow-service',
      name: 'Slow Service',
      kind: 'service',
      metadata: {
        'perf-serviceTime': '60000.0', // 60 seconds
        'perf-replication': '10',
        'perf-maxUtilizationRate': '0.8',
      },
    }

    const result2 = analyzeCapacity(mockElement2, mockLanguageServices)
    expect(result2).toBeDefined()
    expect(result2!.maxArrivalRate).toBeCloseTo(0.133, 3) // (10 × 0.8) / 60 = 0.133
  })

  it('should verify the mathematical formula', () => {
    // Test the exact formula: λ_max = (m × ρ*) / S
    const m = 3 // replication
    const rho = 0.7 // maxUtilizationRate
    const S = 2.5 // serviceTimeSeconds

    const expected = (m * rho) / S // 3 * 0.7 / 2.5 = 2.1 / 2.5 = 0.84

    const mockElement = {
      id: 'formula-test',
      name: 'Formula Test',
      kind: 'service',
      metadata: {
        'perf-serviceTime': '2500.0', // 2.5 seconds
        'perf-replication': '3',
        'perf-maxUtilizationRate': '0.7',
      },
    }

    const result = analyzeCapacity(mockElement, mockLanguageServices)
    expect(result).toBeDefined()
    expect(result!.maxArrivalRate).toBeCloseTo(expected, 3)
  })
})
