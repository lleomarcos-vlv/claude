# ─────────────────────────────────────────────────────────────────────────────
# ElastiCache for Redis 7 — cache + BullMQ queues for the API.
# Deployed in private subnets, encrypted in transit and at rest.
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name_prefix}-redis"
  subnet_ids = aws_subnet.private[*].id
  tags       = local.tags
}

resource "aws_security_group" "redis" {
  name        = "${local.name_prefix}-redis-sg"
  description = "Redis access from the API tasks only."
  vpc_id      = aws_vpc.main.id
  tags        = merge(local.tags, { Name = "${local.name_prefix}-redis-sg" })

  egress {
    description = "Allow all egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "redis_from_api" {
  type                     = "ingress"
  description              = "Redis from the API service"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  security_group_id        = aws_security_group.redis.id
  source_security_group_id = aws_security_group.api.id
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${local.name_prefix}-redis"
  description          = "JardimJá Redis (cache + queues)."

  engine         = "redis"
  engine_version = var.redis_engine_version
  node_type      = var.redis_node_type
  port           = 6379

  num_cache_clusters         = var.redis_num_cache_nodes
  automatic_failover_enabled = var.redis_num_cache_nodes > 1
  multi_az_enabled           = var.redis_num_cache_nodes > 1

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  snapshot_retention_limit = var.environment == "production" ? 7 : 1
  maintenance_window       = "tue:05:00-tue:06:00"
  apply_immediately        = var.environment != "production"

  tags = merge(local.tags, { Name = "${local.name_prefix}-redis" })
}
