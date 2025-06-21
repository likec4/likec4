import type { LikeC4 } from '../../LikeC4'

type CorrectnessIssue = {
  type: 'error' | 'warning'
  category: string
  message: string
  location: string
}

type ElementInfo = {
  element: any
  document: any
  statement: any
}

type GraphData = {
  graph: Map<string, string[]>
  elementMap: Map<string, any>
}

function buildGraph(elements: any[], relationships: any[]): GraphData {
  const graph = new Map<string, string[]>()
  const elementMap = new Map<string, any>()

  // Initialize adjacency list and element map
  for (const element of elements) {
    graph.set(element.id, [])
    elementMap.set(element.id, element)
  }

  // Add edges to the graph
  for (const rel of relationships) {
    const sourceId = rel.source?.model || rel.source?.id
    const targetId = rel.target?.model || rel.target?.id

    if (sourceId && targetId && graph.has(sourceId) && graph.has(targetId)) {
      graph.get(sourceId)!.push(targetId)
    }
  }

  return { graph, elementMap }
}

function initializeDFSState(
  graph: Map<string, string[]>,
): { colors: Map<string, number>; parent: Map<string, string | null> } {
  const colors = new Map<string, number>()
  const parent = new Map<string, string | null>()

  for (const nodeId of Array.from(graph.keys())) {
    colors.set(nodeId, 0) // 0 = white (unvisited)
    parent.set(nodeId, null)
  }

  return { colors, parent }
}

function reconstructCycle(
  detectionPoint: string,
  backEdgeTarget: string,
  parent: Map<string, string | null>,
): string[] {
  const cycle = [detectionPoint]

  // Add the back edge: detectionPoint -> backEdgeTarget
  cycle.push(backEdgeTarget)

  // Build path from backEdgeTarget back to detectionPoint via DFS tree
  let current = backEdgeTarget
  while (current !== detectionPoint) {
    const parentNode = parent.get(current)
    if (!parentNode) {
      // Fallback in case of incomplete parent mapping
      break
    }
    current = parentNode
    if (current !== detectionPoint) {
      cycle.push(current)
    }
  }

  // Add the detection point at the end to complete the cycle
  cycle.push(detectionPoint)
  return cycle
}

function dfsDetectCycle(
  nodeId: string,
  graph: Map<string, string[]>,
  colors: Map<string, number>,
  parent: Map<string, string | null>,
): string[] | null {
  colors.set(nodeId, 1) // Mark as gray (visiting)

  const neighbors = graph.get(nodeId) || []
  for (const neighbor of neighbors) {
    if (colors.get(neighbor) === 1) {
      // Found a back edge - cycle detected
      // nodeId is the detection point, so cycle should start from nodeId
      return reconstructCycle(nodeId, neighbor, parent)
    }

    if (colors.get(neighbor) === 0) {
      parent.set(neighbor, nodeId)
      const cycleFound = dfsDetectCycle(neighbor, graph, colors, parent)
      if (cycleFound) {
        return cycleFound
      }
    }
  }

  colors.set(nodeId, 2) // Mark as black (visited)
  return null
}

function findCyclicDependencies(model: any): { cycle: string[]; elements: any[] } | null {
  try {
    const relationships = [...model.relationships()]
    const elements = [...model.elements()]

    const { graph, elementMap } = buildGraph(elements, relationships)
    const { colors, parent } = initializeDFSState(graph)

    // Check each unvisited node
    for (const nodeId of Array.from(graph.keys())) {
      if (colors.get(nodeId) === 0) {
        const cycle = dfsDetectCycle(nodeId, graph, colors, parent)
        if (cycle) {
          const cycleElements = cycle.map(id => elementMap.get(id)).filter(Boolean)
          return { cycle, elements: cycleElements }
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error in findCyclicDependencies:', error)
    return null
  }
}

function findElementInDocument(elementId: string, document: any): ElementInfo | null {
  if (document.parseResult?.value?.$type !== 'LikeC4Grammar') {
    return null
  }

  const grammar = document.parseResult.value
  const models = grammar.models || []

  for (const model of models) {
    if (!model.elements) continue

    const elementInfo = searchElementInStatements(elementId, model.elements, document)
    if (elementInfo) {
      return elementInfo
    }
  }

  return null
}

function searchElementInStatements(elementId: string, statements: any[], document: any): ElementInfo | null {
  const elementParts = elementId.split('.')
  const isNestedElement = elementParts.length > 1

  for (const statement of statements) {
    if (statement.$type !== 'Element') continue

    if (isNestedElement && elementParts[1]) {
      const topLevelElementName = elementParts[0]!
      const nestedElementName = elementParts[1]!
      const nestedInfo = findNestedElement(statement, topLevelElementName, nestedElementName, document)
      if (nestedInfo) return nestedInfo
    } else {
      if (statement.name === elementId) {
        return { element: elementId, document, statement }
      }
    }
  }

  return null
}

function findNestedElement(
  statement: any,
  topLevelName: string,
  nestedName: string,
  document: any,
): ElementInfo | null {
  if (statement.name !== topLevelName || !statement.body?.elements) {
    return null
  }

  for (const nestedStatement of statement.body.elements) {
    if (nestedStatement.$type === 'Element' && nestedStatement.name === nestedName) {
      return { element: `${topLevelName}.${nestedName}`, document, statement: nestedStatement }
    }
  }

  return null
}

function calculateRelativePath(fullPath: string, workspacePath: string | undefined): string {
  if (!workspacePath || !fullPath.startsWith(workspacePath)) {
    return fullPath
  }
  return fullPath.substring(workspacePath.length + 1) // +1 to remove leading slash
}

function extractLocationFromElementInfo(
  elementInfo: ElementInfo,
  languageServices: any,
): { file: string; line: number } {
  const fullPath = elementInfo.document.uri.fsPath || elementInfo.document.uri.path ||
    elementInfo.document.uri.toString()
  const file = calculateRelativePath(fullPath, languageServices?.workspace)
  const line = (elementInfo.statement.$cstNode?.range?.start?.line || 0) + 1 // Convert 0-based to 1-based

  return { file, line }
}

function formatLocation(element: any, languageServices?: any): string {
  let file = 'unknown'
  let line = 1

  if (!languageServices) {
    return `file: ${file}, line: ${line}, id: ${element.id}`
  }

  try {
    const documents = languageServices.langium.shared.workspace.LangiumDocuments.all.toArray()

    for (const document of documents) {
      const elementInfo = findElementInDocument(element.id, document)
      if (elementInfo) {
        const location = extractLocationFromElementInfo(elementInfo, languageServices)
        file = location.file
        line = location.line
        break
      }
    }
  } catch (error) {
    // Fallback to unknown if any error occurs
  }

  return `file: ${file}, line: ${line}, id: ${element.id}`
}

export function checkCycle(computedModel: any, languageServices: LikeC4): CorrectnessIssue[] {
  const issues: CorrectnessIssue[] = []
  const cyclicResult = findCyclicDependencies(computedModel)

  if (cyclicResult) {
    const { cycle, elements } = cyclicResult
    const cycleDescription = cycle.join(' → ')

    issues.push({
      type: 'warning',
      category: 'CYCLE',
      message: `Cyclic dependency detected: ${cycleDescription}`,
      location: elements.length > 0 ? formatLocation(elements[0], languageServices) : 'unknown',
    })
  }

  return issues
}
