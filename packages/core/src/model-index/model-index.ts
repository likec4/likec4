import type { Predicate } from 'rambdax'
import { values } from 'rambdax'
import type { Element, Fqn, LikeC4Model, Relation, RelationID } from '../types'
import { parentFqn } from '../utils/fqn'

interface ElementTrie {
  el?: Element
  children: Record<string, ElementTrie>
}

function childrenOf(trie: ElementTrie) {
  const children = [] as Element[]
  for (const { el } of values(trie.children)) {
    if (el) {
      children.push(el)
    }
  }
  return children
}

function asPath(id: Fqn) {
  return id.split('.')
}

// interface TaggedResult {
//   elements: Element[]
//   relations: Relation[]
// }

export class ModelIndex {

  private root: ElementTrie = {
    children: {}
  }

  private _elements = new Set<Element>()

  private _relations = new Map<RelationID, Relation>()

  // private _taggedElements = new Map<Tag, Set<Element>>()
  // private _taggedRelations = new Map<Tag, Set<Relation>>()

  get relations(): Relation[] {
    return [...this._relations.values()]
  }

  filterRelations = (predicate: Predicate<Relation>): Relation[] => {
    return [...this._relations.values()].filter(predicate)
  }

  static from({ elements, relations }: Pick<LikeC4Model, 'elements' | 'relations'>): ModelIndex {
    const index = new ModelIndex()
    for (const el of Object.values(elements)) {
      index.addElement(el)
    }
    for (const rel of Object.values(relations)) {
      index.addRelation(rel)
    }
    // for (const view of Object.values(views)) {
    //   state.addView(view)x
    // }
    return index
  }

  addElement(el: Element) {
    const path = asPath(el.id)
    let scope = this.root
    for (const name of path) {
      if (!(name in scope.children)) {
        scope.children[name] = {
          children: {}
        }
      }
      scope = scope.children[name]!
    }
    scope.el = el
    this._elements.add(el)
  //   for (const tag of el.tags) {
  //     const tagged = this._taggedElements.get(tag) ?? new Set()
  //     tagged.add(el)
  //     this._taggedElements.set(tag, tagged)
  //   }
  }

  private locateTrie = (id: Fqn) => {
    let scope = this.root
    for (const name of asPath(id)) {
      if (!(name in scope.children)) {
        throw new Error(`Invalid index, Element not found at path ${name} of ${id}`)
      }
      scope = scope.children[name]!
    }
    return scope
  }

  find = (id: Fqn): Element => {
    const trie = this.locateTrie(id)
    if (!trie.el) {
      throw new Error(`Invalid index, element not found at path ${id}`)
    }
    return trie.el
  }

  children = (id: Fqn): Element[] => {
    return childrenOf(this.locateTrie(id))
  }

  siblings = (id: Fqn): Element[] => {
    const parent = parentFqn(id)
    const trie = parent ? this.locateTrie(parent) : this.root
    return childrenOf(trie).filter(e => e.id !== id)
  }

  /**
   * Ancestors from closest parent to root
   */
  ancestors = (id: Fqn): Element[] => {
    const path = asPath(id)
    const ancestors = [] as Element[]
    // The root
    if (path.length === 1) {
      return ancestors
    }
    // Remove the element itself
    path.pop()
    let name = path.shift()
    let trie = this.root
    while (name) {
      if (!(name in trie.children)) {
        throw new Error(`invalid index, no ${name} found in ${id}`)
      }
      trie = trie.children[name]!
      if (!trie.el) {
        throw new Error(`invalid index, no element ${name} found in ${id}`)
      }
      ancestors.unshift(trie.el)
      name = path.shift()
    }
    return ancestors
  }

  // tagged = (tag?: Tag): TaggedResult => {
  //   return tag ? {
  //     elements: [...this._taggedElements.get(tag)?.values() ?? []],
  //     relations: [...this._taggedRelations.get(tag)?.values() ?? []],
  //   } : {
  //     elements: uniq([...this._taggedElements.values()].flatMap(s => [...s.values()])),
  //     relations: uniq([...this._taggedRelations.values()].flatMap(s => [...s.values()]))
  //   }
  // }

  rootElements(): Element[] {
    return childrenOf(this.root)
  }

  get elements(): Element[] {
    return [...this._elements]
  }

  // hasElement(fqn: Fqn): boolean {
  //   return fqn in this._elements
  // }

  addRelation(rel: Relation) {
    // Validate source and target
    this.locateTrie(rel.source)
    this.locateTrie(rel.target)
    this._relations.set(rel.id, rel)
    // for (const tag of rel.tags) {
    //   const tagged = this._taggedRelations.get(tag) ?? new Set()
    //   tagged.add(rel)
    //   this._taggedRelations.set(tag, tagged)
    // }
  }
}
