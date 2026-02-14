import { isTruthy, map, mapToObj, pipe } from 'remeda';
import { flattenMarkdownOrString } from '../../types';
import { objectHash } from '../../utils';
export function calcViewLayoutHash(view) {
    const tohash = {
        id: view.id,
        __: view._type ?? 'element',
        autoLayout: view.autoLayout,
        nodes: pipe(view.nodes, map(n => ({
            id: n.id,
            icon: isTruthy(n.icon) && n.icon !== 'none' ? 'Y' : 'N',
            title: n.title,
            description: flattenMarkdownOrString(n.description),
            technology: n.technology ?? null,
            shape: n.shape,
            size: n.style.size ?? null,
            iconSize: n.style.iconSize ?? null,
            iconPosition: n.style.iconPosition ?? null,
            textSize: n.style.textSize ?? null,
            padding: n.style.padding ?? null,
            children: n.children,
        })), mapToObj(({ id, ...node }) => [id, node])),
        edges: pipe(view.edges, map(e => ({
            source: e.source,
            target: e.target,
            label: e.label,
            description: flattenMarkdownOrString(e.description),
            technology: e.technology ?? null,
            dir: e.dir,
            head: e.head,
            tail: e.tail,
            line: e.line,
        })), mapToObj(({ source, target, ...edge }) => [`${source}:${target}`, edge])),
    };
    view.hash = objectHash(tohash);
    return view;
}
