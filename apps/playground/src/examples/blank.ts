export const BlankExample = {
  currentFilename: 'blank.c4',
  files: {
    ['blank.c4']: `
specification {
  element actor {
    style {
      shape person
      color secondary
    }
  }
}

model {
  user = actor 'User' {
    description 'A user of my software system'
  }
  softwareSystem = system 'Software System' {
    description 'My software system.'
  }

  user -> softwareSystem "Uses"
}

views {
  view index {
    title 'Landscape'
    include *
  }
}`.trimStart()
  }
}
