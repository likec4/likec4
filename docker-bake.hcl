// docker-bake.hcl
target "docker-metadata-action" {}

target "build-amd64" {
  inherits = ["docker-metadata-action"]
  context = "./"
  dockerfile = "Dockerfile"
  platforms = [
    "linux/amd64"
  ]
}

target "build-arm64" {
  inherits = ["docker-metadata-action"]
  context = "./"
  dockerfile = "Dockerfile"
  platforms = [
    "linux/arm64"
  ]
}
