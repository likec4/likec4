import type { DiagramView } from '@likec4/core'
import { isString } from '@likec4/core'
import { zip } from 'rambdax'

function commonPath(diagrams: DiagramView[], sep = '/') {
  if (diagrams.length <= 1) return ''
  const firstWithDocUri = diagrams.find(v => isString(v.docUri))
  if (!firstWithDocUri || !firstWithDocUri.docUri) return ''
  const parts = new URL(firstWithDocUri.docUri).pathname.split(sep)
  let endOfPrefix = parts.length
  for (const diagram of diagrams) {
    if (diagram === firstWithDocUri || !diagram.docUri) {
      continue
    }

    const compare = new URL(diagram.docUri).pathname.split(sep)
    for (let i = 0; i < endOfPrefix; i++) {
      if (compare[i] !== parts[i]) {
        endOfPrefix = i
      }
    }

    if (endOfPrefix === 0) return ''
  }

  const prefix = parts.slice(0, endOfPrefix).join(sep)
  return prefix.endsWith(sep) ? prefix : prefix + sep
}

export interface DiagramViewWithPath extends DiagramView {
  docPath: string[]
}

export function addDocPaths(diagrams: DiagramView[]): DiagramViewWithPath[] {
  const commonPrefix = commonPath(diagrams)
  return diagrams
    .map(({ docUri = 'memory://virtual.c4', ...diagram }) => {
      const path = new URL(docUri).pathname
      const parts = path.replace(commonPrefix, '').split('/')
      parts.pop() // remove filename
      return {
        ...diagram,
        docUri,
        docPath: parts
      }
    })
    .sort((a, b) => {
      if (a.docPath.length === b.docPath.length) {
        if (a.docPath.length === 0) {
          return 0
        }

        return zip(a.docPath, b.docPath).reduce((acc, [a, b]) => {
          return acc || a.localeCompare(b)
        }, 0)
      }
      return a.docPath.length - b.docPath.length
    })
}
