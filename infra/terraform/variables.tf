# ─────────────────────────────────────────────────────────────────────────────
# Input variables. Sizes/counts are variables so the same code produces a
# cheap staging footprint and a beefier prod one — see terraform.tfvars.example.
# ─────────────────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region to deploy into (São Paulo by default)."
  type        = string
  default     = "sa-east-1"
}

variable "environment" {
  description = "Deployment environment name (staging | production)."
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be one of: staging, production."
  }
}

variable "project" {
  description = "Project slug used to prefix resource names."
  type        = string
  default     = "jardimja"
}

# ── Networking ───────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "az_count" {
  description = "Number of Availability Zones to spread subnets across."
  type        = number
  default     = 2
}

variable "single_nat_gateway" {
  description = "Use one shared NAT gateway (cheaper) instead of one per AZ."
  type        = bool
  default     = true
}

# ── RDS (PostgreSQL + PostGIS) ───────────────────────────────────────────────
variable "db_engine_version" {
  description = "PostgreSQL major/minor version."
  type        = string
  default     = "16.4"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.medium"
}

variable "db_allocated_storage" {
  description = "Initial storage (GiB)."
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Upper bound for storage autoscaling (GiB)."
  type        = number
  default     = 100
}

variable "db_multi_az" {
  description = "Run RDS Multi-AZ (recommended for production)."
  type        = bool
  default     = false
}

variable "db_name" {
  description = "Initial database name."
  type        = string
  default     = "jardimja"
}

variable "db_username" {
  description = "Master username. The password is generated and stored in Secrets Manager by RDS (manage_master_user_password)."
  type        = string
  default     = "jardimja"
}

# ── ElastiCache (Redis) ──────────────────────────────────────────────────────
variable "redis_engine_version" {
  description = "Redis engine version."
  type        = string
  default     = "7.1"
}

variable "redis_node_type" {
  description = "ElastiCache node type."
  type        = string
  default     = "cache.t4g.small"
}

variable "redis_num_cache_nodes" {
  description = "Number of nodes (replicas + primary) in the replication group."
  type        = number
  default     = 1
}

# ── ECS / API service ────────────────────────────────────────────────────────
variable "api_image" {
  description = "Fully-qualified container image for the API (e.g. ghcr.io/<org>/jardimja-api:sha). Pushed by CI/CD."
  type        = string
  default     = "ghcr.io/OWNER/jardimja-api:latest"
}

variable "api_container_port" {
  description = "Port the API listens on inside the container (API_PORT)."
  type        = number
  default     = 3333
}

variable "api_cpu" {
  description = "Fargate task CPU units (256 = 0.25 vCPU)."
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Fargate task memory (MiB)."
  type        = number
  default     = 1024
}

variable "api_desired_count" {
  description = "Baseline number of API tasks."
  type        = number
  default     = 2
}

variable "api_min_count" {
  description = "Minimum tasks for autoscaling."
  type        = number
  default     = 2
}

variable "api_max_count" {
  description = "Maximum tasks for autoscaling."
  type        = number
  default     = 6
}

variable "api_health_check_path" {
  description = "HTTP path the ALB target group uses for health checks."
  type        = string
  default     = "/health"
}

# ── TLS / DNS (optional) ─────────────────────────────────────────────────────
variable "acm_certificate_arn" {
  description = "ACM cert ARN (regional) for the ALB HTTPS listener. Empty = HTTP-only listener (dev/staging)."
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Public domain for the API (e.g. api.jardimja.com.br). Informational; DNS records are managed outside this module."
  type        = string
  default     = ""
}

# ── App secrets ──────────────────────────────────────────────────────────────
variable "log_retention_days" {
  description = "CloudWatch log retention for the API service."
  type        = number
  default     = 30
}
