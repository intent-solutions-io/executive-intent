# Executive Intent - OpenTofu Outputs

output "workload_identity_provider" {
  description = "Workload Identity Provider for GitHub Actions"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "deploy_service_account" {
  description = "Service account email for GitHub Actions deployments"
  value       = google_service_account.github_deploy.email
}

output "worker_service_account" {
  description = "Service account email for worker/Inngest"
  value       = google_service_account.worker.email
}

output "kms_keyring" {
  description = "KMS keyring name"
  value       = google_kms_key_ring.app.name
}

output "kms_token_key" {
  description = "KMS key for token encryption"
  value       = google_kms_crypto_key.token_kek.name
}
