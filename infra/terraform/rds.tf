# ─────────────────────────────────────────────────────────────────────────────
# RDS PostgreSQL 16 with PostGIS.
#
# PostGIS is NOT installed by the parameter group — it ships with the RDS
# Postgres engine and is enabled per-database with a one-time SQL statement:
#
#     CREATE EXTENSION IF NOT EXISTS postgis;
#
# The Prisma schema already declares `extensions = [postgis]`, so the first
# `prisma migrate deploy` (run by cd-staging.yml) creates it. We also allow
# PostGIS-related libraries via shared_preload_libraries where relevant.
#
# The master password is generated and rotated by RDS into Secrets Manager
# (manage_master_user_password = true) — it never touches Terraform state.
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db"
  subnet_ids = aws_subnet.private[*].id
  tags       = merge(local.tags, { Name = "${local.name_prefix}-db-subnets" })
}

resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Postgres access from the API tasks only."
  vpc_id      = aws_vpc.main.id
  tags        = merge(local.tags, { Name = "${local.name_prefix}-rds-sg" })

  egress {
    description = "Allow all egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "rds_from_api" {
  type                     = "ingress"
  description              = "Postgres from the API service"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = aws_security_group.api.id
}

resource "aws_db_parameter_group" "postgres16" {
  name        = "${local.name_prefix}-pg16"
  family      = "postgres16"
  description = "JardimJá Postgres 16 parameters."

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # log queries slower than 1s
  }

  # PostGIS itself needs no preload; this is a placeholder for tuning, e.g.
  # pg_stat_statements for query insight.
  parameter {
    name         = "shared_preload_libraries"
    value        = "pg_stat_statements"
    apply_method = "pending-reboot"
  }

  tags = local.tags
}

resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-postgres"
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  # RDS manages the master password in Secrets Manager and rotates it.
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres16.name

  multi_az            = var.db_multi_az
  publicly_accessible = false

  backup_retention_period = var.environment == "production" ? 14 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  performance_insights_enabled = true
  copy_tags_to_snapshot        = true
  deletion_protection          = var.environment == "production"
  skip_final_snapshot          = var.environment != "production"
  final_snapshot_identifier    = var.environment == "production" ? "${local.name_prefix}-postgres-final" : null
  apply_immediately            = var.environment != "production"

  tags = merge(local.tags, { Name = "${local.name_prefix}-postgres" })
}
