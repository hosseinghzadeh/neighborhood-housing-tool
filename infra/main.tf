locals {
  build_locally = var.image == null

  db_name = "neighborhood"
  db_user = "app"

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

  env = concat(local.ai_env, [
    "DATABASE_URL=postgres://${local.db_user}:${urlencode(var.db_password)}@${docker_container.db.name}:5432/${local.db_name}",
  ])

  ports {
    internal = 3000
    external = var.host_port
  }

  networks_advanced {
    name = docker_network.app.name
  }
}

# ---- database --------------------------------------------------------------

# Private network shared by the app and the database. Postgres publishes no
# host port, so only the app can reach it (by container name).
resource "docker_network" "app" {
  name = "${var.container_name}-net"
}

# Named volume so the data survives container restarts and re-creation.
resource "docker_volume" "db_data" {
  name = "${var.container_name}-db-data"
}

resource "docker_image" "db" {
  name         = var.db_image
  keep_locally = true
}

resource "docker_container" "db" {
  name    = "${var.container_name}-db"
  image   = docker_image.db.image_id
  restart = "unless-stopped"

  env = [
    "POSTGRES_DB=${local.db_name}",
    "POSTGRES_USER=${local.db_user}",
    "POSTGRES_PASSWORD=${var.db_password}",
  ]

  # Postgres 18+ images keep their data in a versioned directory under here.
  volumes {
    volume_name    = docker_volume.db_data.name
    container_path = "/var/lib/postgresql"
  }

  networks_advanced {
    name = docker_network.app.name
  }
}
