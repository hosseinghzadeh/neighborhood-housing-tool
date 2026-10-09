variable "image" {
  description = "Existing image to run (for example ghcr.io/hosseinghzadeh/neighborhood-housing-tool:latest). When null, the image is built from the repository Dockerfile instead."
  type        = string
  default     = null
}

variable "image_name" {
  description = "Name and tag given to the image when it is built locally."
  type        = string
  default     = "neighborhood-housing-tool:local"
}

variable "container_name" {
  description = "Name of the container."
  type        = string
  default     = "neighborhood-housing-tool"
}

variable "host_port" {
  description = "Port on the host that is mapped to the app."
  type        = number
  default     = 8080
}

variable "ai_api_key" {
  description = "Optional API key for an OpenAI-compatible provider (enables the free-text request box)."
  type        = string
  default     = null
  sensitive   = true
}

variable "ai_api_base_url" {
  description = "Optional base URL of an OpenAI-compatible API, for example https://api.groq.com/openai/v1."
  type        = string
  default     = null
}

variable "ai_model" {
  description = "Optional model name for the OpenAI-compatible provider."
  type        = string
  default     = null
}
