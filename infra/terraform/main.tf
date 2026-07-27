# ─────────────────────────────────────────────────────────────────────────────
# Shared data sources, locals and the application Secrets Manager container.
# ─────────────────────────────────────────────────────────────────────────────

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

locals {
  name_prefix = "${var.project}-${var.environment}"

  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)

  # Deterministic /20 subnets carved out of the VPC CIDR, public first.
  public_subnet_cidrs  = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 4, i)]
  private_subnet_cidrs = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 4, i + 8)]

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ── Application secrets ───────────────────────────────────────────────────────
# We create the *container* for the app secrets here but never the *values*:
# operators populate it out-of-band (console/CLI/CI), so no secret material is
# ever committed or stored in Terraform state as plaintext.
#
# Expected JSON keys (mirror .env.example):
#   JWT_SECRET, OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY,
#   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, MERCADOPAGO_ACCESS_TOKEN,
#   MERCADOPAGO_WEBHOOK_SECRET, FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY
resource "aws_secretsmanager_secret" "app" {
  name        = "${local.name_prefix}/app"
  description = "Application secrets for the JardimJá API (populated out-of-band)."
  tags        = local.tags
}

# Seed an empty JSON skeleton on first apply; ignore future drift so operator
# edits to the secret value are never reverted by Terraform.
resource "aws_secretsmanager_secret_version" "app_skeleton" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    JWT_SECRET                 = ""
    OPENAI_API_KEY             = ""
    GEMINI_API_KEY             = ""
    ANTHROPIC_API_KEY          = ""
    STRIPE_SECRET_KEY          = ""
    STRIPE_WEBHOOK_SECRET      = ""
    MERCADOPAGO_ACCESS_TOKEN   = ""
    MERCADOPAGO_WEBHOOK_SECRET = ""
    FCM_PROJECT_ID             = ""
    FCM_CLIENT_EMAIL           = ""
    FCM_PRIVATE_KEY            = ""
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
