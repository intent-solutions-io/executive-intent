variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "github_org" {
  description = "GitHub organization name"
  type        = string
  default     = "intent-solutions-io"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "executive-intent"
}

variable "firebase_site_id" {
  description = "Firebase Hosting site ID"
  type        = string
  default     = "executive-intent"
}
