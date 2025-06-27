import { isTruthy, map, mapToObj, pick, pipe } from 'remeda'
import type { SetOptional } from 'type-fest'
import type { ComputedView } from '../../types'
import { objectHash } from '../../utils'

export function calcViewLayoutHash<V extends ComputedView>(view: SetOptional<V, 'hash'>): V {
  const tohash = {
    id: view.id,
    __: view._type ?? 'element',
    autoLayout: view.autoLayout,
    nodes: pipe(
      view.nodes,
      map(n => ({
        id: n.id,
        icon: isTruthy(n.icon) ? 'Y' : 'N',
        title: n.title,
        description: n.description?.md ?? n.description?.txt ?? null,
        technology: n.technology ?? null,
        shape: n.shape,
        size: n.style.size ?? null,
        textSize: n.style.textSize ?? null,
        padding: n.style.padding ?? null,
        children: n.children,
      })),
      mapToObj(({ id, ...node }) => [id, node]),
    ),
    edges: pipe(
      view.edges,
      map(e => ({
        source: e.source,
        target: e.target,
        label: e.label,
        description: e.description?.md ?? e.description?.txt ?? null,
        technology: e.technology ?? null,
        dir: e.dir,
        head: e.head,
        tail: e.tail,
        line: e.line,
      })),
      mapToObj(({ source, target, ...edge }) => [`${source}:${target}`, edge]),
    ),
  }
  view.hash = objectHash(tohash)
  return view as unknown as V
}
