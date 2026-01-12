# Executive Intent - Main OpenTofu Configuration

locals {
  project_id = var.project_id
  region     = var.region
  env        = var.environment

  labels = {
    project     = "executive-intent"
    environment = var.environment
    managed_by  = "opentofu"
  }
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "cloudkms.googleapis.com",
    "secretmanager.googleapis.com",
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
    "cloudfunctions.googleapis.com",
    "run.googleapis.com",
    "aiplatform.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
  ])

  project = local.project_id
  service = each.value

  disable_dependent_services = false
  disable_on_destroy         = false
}
