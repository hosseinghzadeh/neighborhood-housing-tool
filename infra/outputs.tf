output "url" {
  description = "Where the app is reachable on the host."
  value       = "http://localhost:${var.host_port}"
}

output "container_id" {
  description = "ID of the running container."
  value       = docker_container.app.id
}
