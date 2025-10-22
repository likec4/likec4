import type * as c4 from '@likec4/core'
import {
  hasAtLeast,
  isEmpty,
  unique,
} from 'remeda'
import type {
  ParsedAstExtend,
} from '../../ast'

export class MergedExtends {
  private mergedData = new Map<string, {
    links: c4.Link[]
    tags: c4.Tag[]
    metadata: Record<string, string | string[]>
  }>()

  private mergeMetadata(
    existing: Record<string, string | string[]>,
    incoming: Record<string, string | string[]>,
  ): Record<string, string | string[]> {
    const result: Record<string, string | string[]> = { ...existing }

    for (const [key, incomingValue] of Object.entries(incoming)) {
      const existingValue = result[key]

      if (existingValue === undefined) {
        result[key] = incomingValue
        continue
      }

      // Convert both values to arrays to make merging easier.
      const existingArray = Array.isArray(existingValue) ? existingValue : [existingValue]
      const incomingArray = Array.isArray(incomingValue) ? incomingValue : [incomingValue]

      // Merge and deduplicate based on value.
      const merged = unique([...existingArray, ...incomingArray])

      result[key] = merged.length === 1 ? merged[0]! : merged
    }

    return result
  }

  merge(parsedExtends: ParsedAstExtend[]): void {
    for (const parsedExtend of parsedExtends) {
      const { id, links, tags, metadata } = parsedExtend
      const existing = this.mergedData.get(id) ?? {
        links: [],
        tags: [],
        metadata: {},
      }
      if (links) {
        existing.links.push(...links)
      }
      if (tags) {
        existing.tags = unique([
          ...existing.tags,
          ...tags,
        ])
      }
      if (metadata) {
        existing.metadata = this.mergeMetadata(existing.metadata, metadata)
      }
      this.mergedData.set(id, existing)
    }
  }

  applyExtended<
    E extends {
      id: string
      tags?: readonly string[] | null
      links?: readonly c4.Link[] | null
      metadata?: Record<string, string | string[]>
    },
  >(el: E): E {
    const extendData = this.mergedData.get(el.id)
    if (!extendData) {
      return el
    }

    let links = extendData.links
    if (el.links && el.links.length > 0) {
      links = [
        ...el.links,
        ...links,
      ]
    }

    let tags = extendData.tags
    if (el.tags && el.tags.length > 0) {
      tags = unique([
        ...el.tags as c4.Tag[],
        ...tags,
      ])
    }

    let metadata = extendData.metadata
    if (el.metadata) {
      metadata = this.mergeMetadata(el.metadata, extendData.metadata)
    }

    return {
      ...el,
      tags: hasAtLeast(tags, 1) ? tags : null,
      links: hasAtLeast(links, 1) ? links : null,
      ...(!isEmpty(metadata) && { metadata }),
    }
  }
}
