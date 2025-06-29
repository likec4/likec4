// docker-bake.hcl
target "docker-metadata-action" {}

target "ubuntu-24.04" {
  inherits = ["docker-metadata-action"]
  context = "./"
  dockerfile = "Dockerfile"
  platforms = [
    "linux/amd64"
  ]
}

target "ubuntu-24.04-arm" {
  inherits = ["docker-metadata-action"]
  context = "./"
  dockerfile = "Dockerfile"
  platforms = [
    "linux/arm64"
  ]
}
