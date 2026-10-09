locals {
  build_locally = var.image == null

  # Only pass AI settings that were actually provided; without them the app
  # falls back to its offline parser.
  ai_env = compact([
    var.ai_api_key == null ? "" : "AI_API_KEY=${var.ai_api_key}",
    var.ai_api_base_url == null ? "" : "AI_API_BASE_URL=${var.ai_api_base_url}",
    var.ai_model == null ? "" : "AI_MODEL=${var.ai_model}",
  ])
}

resource "docker_image" "app" {
  name         = local.build_locally ? var.image_name : var.image
  keep_locally = true

  dynamic "build" {
    for_each = local.build_locally ? [1] : []
    content {
      context    = abspath("${path.module}/..")
      dockerfile = "Dockerfile"
    }
  }
}

resource "docker_container" "app" {
  name    = var.container_name
  image   = docker_image.app.image_id
  restart = "unless-stopped"
  env     = local.ai_env

  ports {
    internal = 3000
    external = var.host_port
  }
}
