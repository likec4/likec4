import { computed } from 'nanostores'
import { $views } from '../likec4'
import { useStore } from '@nanostores/react'

const $diagramslist = computed($views, views => Object.values(views))

export const useDiagramsList = () => useStore($diagramslist)
