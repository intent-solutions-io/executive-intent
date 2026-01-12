# Executive Intent - Cloud KMS Configuration

# KMS Keyring
resource "google_kms_key_ring" "app" {
  name     = "executive-intent-${var.environment}"
  location = var.region
  project  = var.project_id

  depends_on = [google_project_service.apis]
}

# KMS Key for token encryption (KEK - Key Encryption Key)
resource "google_kms_crypto_key" "token_kek" {
  name     = "token-kek"
  key_ring = google_kms_key_ring.app.id

  purpose = "ENCRYPT_DECRYPT"

  rotation_period = "7776000s" # 90 days

  lifecycle {
    prevent_destroy = true
  }

  labels = local.labels
}
