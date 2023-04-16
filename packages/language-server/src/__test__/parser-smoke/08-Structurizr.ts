const model = `
specification {
  element person
  element group
  element softwareSystem
  element container
  element component
}
`
export const valid_08_Structurizr =
  model +
  `
model {
  u = person "User"
  s = softwareSystem "Software System" {
      webapp = container "Web Application" "" "Spring Boot"
      database = container "Database" "" "Relational database schema"
  }

  u -> webapp "Uses"
  webapp -> database "Reads from and writes to"
}
`
