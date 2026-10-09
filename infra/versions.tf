terraform {
  required_version = ">= 1.5.0"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 4.0"
    }
  }

  # State is kept locally on purpose (see README, "Limitations"). A shared
  # environment would use a remote backend instead.
}

provider "docker" {
  # Talks to the local Docker daemon by default. To provision a remote host,
  # set host = "ssh://user@server" (or use the DOCKER_HOST environment variable).
}
