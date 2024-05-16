export const BlankExample = {
  currentFilename: 'blank.c4',
  files: {
    ['blank.c4']: `
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
}`.trimStart()
  }
}
