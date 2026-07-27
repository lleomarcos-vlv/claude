# ─────────────────────────────────────────────────────────────────────────────
# Outputs — the handful of values other tooling / operators need.
# Secrets are intentionally not exposed here.
# ─────────────────────────────────────────────────────────────────────────────

output "vpc_id" {
  description = "VPC ID."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs (ALB)."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs (ECS/RDS/Redis)."
  value       = aws_subnet.private[*].id
}

output "api_alb_dns_name" {
  description = "Public DNS name of the API load balancer. Point a CNAME/ALIAS here."
  value       = aws_lb.api.dns_name
}

output "rds_endpoint" {
  description = "RDS endpoint (host:port)."
  value       = aws_db_instance.main.endpoint
}

output "rds_master_secret_arn" {
  description = "Secrets Manager ARN holding the RDS-managed master credentials."
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
}

output "redis_primary_endpoint" {
  description = "ElastiCache Redis primary endpoint."
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "media_bucket_name" {
  description = "S3 media bucket name (S3_BUCKET)."
  value       = aws_s3_bucket.media.bucket
}

output "media_cdn_domain" {
  description = "CloudFront domain for media (basis for S3_PUBLIC_URL)."
  value       = aws_cloudfront_distribution.media.domain_name
}

output "app_secret_arn" {
  description = "Secrets Manager ARN of the app secret operators must populate."
  value       = aws_secretsmanager_secret.app.arn
}

output "ecs_cluster_name" {
  description = "ECS cluster name (for CI/CD deploys)."
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name (for CI/CD deploys)."
  value       = aws_ecs_service.api.name
}
