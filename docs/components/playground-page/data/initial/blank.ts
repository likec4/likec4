import type { FilesStore } from '../atoms'

export const BlankPlayground = {
  current: 'file:///empty.c4',
  files: {
    'file:///empty.c4': `
specification {
  element system
}
model {
  sys = system 'System'
}
views {
  view index {
    title 'Landscape'
    include *
  }
}
`.trimStart()
  }
} satisfies FilesStore
