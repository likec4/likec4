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
    metadata: Record<string, string>
  }>()

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
        existing.metadata = {
          ...existing.metadata,
          ...metadata,
        }
      }
      this.mergedData.set(id, existing)
    }
  }

  apply<
    E extends {
      id: c4.Fqn
      tags?: c4.NonEmptyArray<c4.Tag> | null
      links?: c4.NonEmptyArray<c4.Link> | null
      metadata?: Record<string, string>
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
        ...el.tags,
        ...tags,
      ])
    }

    let metadata = extendData.metadata
    if (el.metadata) {
      metadata = {
        ...el.metadata,
        ...extendData.metadata,
      }
    }
    // const links = [...(el.links ?? []), ...extendData.links]
    // const tags = unique([...(el.tags ?? []), ...extendData.tags)
    // const metadata = { ...el.metadata, ...extendData.metadata }
    return {
      ...el,
      tags: hasAtLeast(tags, 1) ? tags : null,
      links: hasAtLeast(links, 1) ? links : null,
      ...(!isEmpty(metadata) && { metadata }),
    }
  }
}
