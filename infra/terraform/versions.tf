# ─────────────────────────────────────────────────────────────────────────────
# Provider & backend requirements.
#
# The backend is left partial on purpose — configure it per environment with
# `terraform init -backend-config=...` (or a backend.hcl file) so state for
# staging and prod lives in separate S3 keys. Never commit real state.
# ─────────────────────────────────────────────────────────────────────────────
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Example remote state backend (uncomment & configure via -backend-config):
  # backend "s3" {
  #   bucket         = "jardimja-tfstate"
  #   key            = "envs/staging/terraform.tfstate"
  #   region         = "sa-east-1"
  #   dynamodb_table = "jardimja-tflock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "jardimja"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront ACM certificates must live in us-east-1 regardless of the app region.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "jardimja"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
