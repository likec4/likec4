import type { LikeC4 } from '../../LikeC4'

type CapacityResult = {
  elementId: string
  elementName: string
  elementKind: string
  serviceTimeMs: number
  serviceTimeSeconds: number
  replication: number
  maxUtilizationRate: number
  maxArrivalRate: number
  location: string
}

const REQUIRED_PERF_PROPERTIES = [
  'perf-serviceTime',
  'perf-replication',
  'perf-maxUtilizationRate',
] as const

/**
 * Analyze capacity for a single element using the formula: λ_max = (m × ρ*) / S
 * Where:
 * - λ_max: Maximum sustainable arrival rate (requests per second)
 * - m: Number of parallel replicas/instances (perf-replication)
 * - ρ*: Target utilization threshold (perf-maxUtilizationRate)
 * - S: Mean service time per request in seconds (perf-serviceTime / 1000)
 */
export function analyzeCapacity(element: any, languageServices: LikeC4): CapacityResult | null {
  try {
    // Get element metadata
    const metadata = getElementMetadata(element)
    if (!metadata) {
      return null // Skip elements without metadata
    }

    // Check if all required properties are present
    const missingProperties = REQUIRED_PERF_PROPERTIES.filter(prop => !(prop in metadata))
    if (missingProperties.length > 0) {
      return null // Skip elements with incomplete metadata
    }

    // Extract and validate performance parameters
    const serviceTimeMs = parseFloat(metadata['perf-serviceTime'] || '')
    const replication = parseInt(metadata['perf-replication'] || '', 10)
    const maxUtilizationRate = parseFloat(metadata['perf-maxUtilizationRate'] || '')

    // Validate parameter ranges
    if (isNaN(serviceTimeMs) || serviceTimeMs <= 0) {
      return null
    }
    if (isNaN(replication) || replication <= 0) {
      return null
    }
    if (isNaN(maxUtilizationRate) || maxUtilizationRate <= 0 || maxUtilizationRate > 1) {
      return null
    }

    // Convert service time from milliseconds to seconds
    const serviceTimeSeconds = serviceTimeMs / 1000

    // Apply capacity planning formula: λ_max = (m × ρ*) / S
    const maxArrivalRate = (replication * maxUtilizationRate) / serviceTimeSeconds

    // Get element location for reporting
    const location = formatLocation(element, languageServices)

    return {
      elementId: element.id,
      elementName: element.name || element.id,
      elementKind: element.kind,
      serviceTimeMs,
      serviceTimeSeconds,
      replication,
      maxUtilizationRate,
      maxArrivalRate,
      location,
    }
  } catch (error) {
    console.error(`Error analyzing capacity for element ${element.id}:`, error)
    return null
  }
}

/**
 * Extract metadata from an element
 */
function getElementMetadata(element: any): { [key: string]: string } | undefined {
  // Try the getMetadata() method first (ElementModel API)
  let metadata: any = null
  if (typeof element.getMetadata === 'function') {
    try {
      metadata = element.getMetadata()
    } catch (error) {
      // Silently fail and try fallback
    }
  }

  // Fallback to raw metadata property access
  if (!metadata) {
    metadata = element.metadata
  }

  // Return metadata if it exists and has properties
  return metadata && Object.keys(metadata).length > 0 ? metadata : undefined
}

/**
 * Format element location for reporting
 */
function formatLocation(element: any, languageServices: any): string {
  try {
    // Try to get file and line information
    if (element.location) {
      const fullPath = element.location.uri?.fsPath || element.location.uri?.path || element.location.uri?.toString()
      if (fullPath) {
        const file = calculateRelativePath(fullPath, languageServices?.workspace)
        const line = (element.location.range?.start?.line || 0) + 1 // Convert 0-based to 1-based
        return `${file}:${line}`
      }
    }

    // Fallback to just the element ID
    return element.id
  } catch (error) {
    return element.id
  }
}

/**
 * Calculate relative path from workspace root
 */
function calculateRelativePath(fullPath: string, workspacePath?: string): string {
  if (!workspacePath) {
    return fullPath
  }

  try {
    // Simple relative path calculation
    if (fullPath.startsWith(workspacePath)) {
      return fullPath.substring(workspacePath.length + 1) // +1 for the path separator
    }
    return fullPath
  } catch (error) {
    return fullPath
  }
}
