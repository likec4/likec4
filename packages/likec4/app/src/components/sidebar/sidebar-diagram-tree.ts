import type { DiagramView } from '@likec4/core'
import { flattenTree } from 'react-accessible-treeview'
import { groupBy } from 'remeda'

interface ITreeNode {
  id: string
  name: string
  children?: ITreeNode[]
}

export function buildDiagramTreeAtom(views: DiagramView[]) {
  const byPath = groupBy(views, v => v.relativePath ?? '')

  const folders = Object.keys(byPath)
    .filter(path => path !== '')
    .map(path => {
      const segments = path.split('/')
      const name = segments.pop() as string
      return {
        path,
        name,
        parent: segments.join('/')
      }
    })

  const viewsInPath = (path: string) =>
    byPath[path]?.map(v => ({
      id: v.id,
      name: v.title || v.id
    })) || []

  const traverse = (path: string): ITreeNode[] => {
    const nested = folders
      .filter(f => f.parent === path)
      .map(f => {
        return {
          id: `fs:${f.path}`,
          name: f.name,
          children: traverse(f.path)
        }
      })
    return [...nested, ...viewsInPath(path)]
  }

  const tree: ITreeNode = {
    id: '',
    name: '',
    children: traverse('')
  }

  return flattenTree(tree)
}
