# ─────────────────────────────────────────────────────────────────────────────
# ECS Fargate service for the API, fronted by an Application Load Balancer,
# with target-group health checks and CPU-based autoscaling.
#
# ── Alternative: EKS ─────────────────────────────────────────────────────────
# If the team prefers Kubernetes, replace this file with an EKS cluster
# (terraform-aws-modules/eks/aws) + an ALB Ingress Controller, and deploy the
# manifests in ../k8s. ECS Fargate is the default here because it removes
# node/control-plane management for a service of this size. Keep exactly one of
# {ECS, EKS} to avoid two competing API deployments.
# ─────────────────────────────────────────────────────────────────────────────

# ── CloudWatch logs ──────────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${local.name_prefix}-api"
  retention_in_days = var.log_retention_days
  tags              = local.tags
}

# ── Security groups: ALB (public) → API tasks (private) ──────────────────────
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Public ingress to the ALB."
  vpc_id      = aws_vpc.main.id
  tags        = merge(local.tags, { Name = "${local.name_prefix}-alb-sg" })

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "api" {
  name        = "${local.name_prefix}-api-sg"
  description = "API tasks; only the ALB may reach the container port."
  vpc_id      = aws_vpc.main.id
  tags        = merge(local.tags, { Name = "${local.name_prefix}-api-sg" })

  egress {
    description = "Allow all egress (DB, Redis, S3, AI providers, payments)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "api_from_alb" {
  type                     = "ingress"
  description              = "Container port from the ALB"
  from_port                = var.api_container_port
  to_port                  = var.api_container_port
  protocol                 = "tcp"
  security_group_id        = aws_security_group.api.id
  source_security_group_id = aws_security_group.alb.id
}

# ── Application Load Balancer ─────────────────────────────────────────────────
resource "aws_lb" "api" {
  name               = "${local.name_prefix}-api-alb"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  drop_invalid_header_fields = true
  tags                       = merge(local.tags, { Name = "${local.name_prefix}-api-alb" })
}

resource "aws_lb_target_group" "api" {
  name        = "${local.name_prefix}-api-tg"
  port        = var.api_container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id

  health_check {
    path                = var.api_health_check_path
    protocol            = "HTTP"
    matcher             = "200-299"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  deregistration_delay = 30
  tags                 = local.tags
}

# HTTP listener: redirects to HTTPS when a cert is provided, otherwise forwards.
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = var.acm_certificate_arn == "" ? "forward" : "redirect"

    target_group_arn = var.acm_certificate_arn == "" ? aws_lb_target_group.api.arn : null

    dynamic "redirect" {
      for_each = var.acm_certificate_arn == "" ? [] : [1]
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }
}

resource "aws_lb_listener" "https" {
  count             = var.acm_certificate_arn == "" ? 0 : 1
  load_balancer_arn = aws_lb.api.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# ── ECS cluster, task definition and service ─────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.tags
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${local.name_prefix}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = var.api_image
      essential = true

      portMappings = [
        { containerPort = var.api_container_port, protocol = "tcp" }
      ]

      # Non-secret configuration.
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "API_PORT", value = tostring(var.api_container_port) },
        { name = "S3_REGION", value = var.aws_region },
        { name = "S3_BUCKET", value = aws_s3_bucket.media.bucket },
        { name = "S3_PUBLIC_URL", value = "https://${aws_cloudfront_distribution.media.domain_name}" },
        { name = "REDIS_URL", value = "rediss://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379" },
      ]

      # Secrets are injected by ECS from Secrets Manager — never in plaintext.
      # DATABASE_URL is assembled by the app from these parts, or store a full
      # URL under the app secret. Here we inject the discrete pieces + app keys.
      secrets = [
        { name = "DB_USERNAME", valueFrom = "${aws_db_instance.main.master_user_secret[0].secret_arn}:username::" },
        { name = "DB_PASSWORD", valueFrom = "${aws_db_instance.main.master_user_secret[0].secret_arn}:password::" },
        { name = "JWT_SECRET", valueFrom = "${aws_secretsmanager_secret.app.arn}:JWT_SECRET::" },
        { name = "OPENAI_API_KEY", valueFrom = "${aws_secretsmanager_secret.app.arn}:OPENAI_API_KEY::" },
        { name = "GEMINI_API_KEY", valueFrom = "${aws_secretsmanager_secret.app.arn}:GEMINI_API_KEY::" },
        { name = "ANTHROPIC_API_KEY", valueFrom = "${aws_secretsmanager_secret.app.arn}:ANTHROPIC_API_KEY::" },
        { name = "STRIPE_SECRET_KEY", valueFrom = "${aws_secretsmanager_secret.app.arn}:STRIPE_SECRET_KEY::" },
        { name = "MERCADOPAGO_ACCESS_TOKEN", valueFrom = "${aws_secretsmanager_secret.app.arn}:MERCADOPAGO_ACCESS_TOKEN::" },
        { name = "FCM_PRIVATE_KEY", valueFrom = "${aws_secretsmanager_secret.app.arn}:FCM_PRIVATE_KEY::" },
      ]

      # DATABASE_URL / host come from RDS; the app composes the final DSN.
      # Provide the host/db separately for that composition.
      dockerLabels = {
        "com.jardimja.db_host" = aws_db_instance.main.address
        "com.jardimja.db_name" = var.db_name
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "node -e \"require('http').get('http://localhost:${var.api_container_port}${var.api_health_check_path}',r=>process.exit(r.statusCode<400?0:1)).on('error',()=>process.exit(1))\""]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    }
  ])

  tags = local.tags
}

resource "aws_ecs_service" "api" {
  name            = "${local.name_prefix}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.api.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = var.api_container_port
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  # Let CI/CD (or blue-green tooling) manage the image without TF fighting it.
  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  depends_on = [aws_lb_listener.http]
  tags       = local.tags
}

# ── Autoscaling (target tracking on CPU) ─────────────────────────────────────
resource "aws_appautoscaling_target" "api" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = var.api_min_count
  max_capacity       = var.api_max_count
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${local.name_prefix}-api-cpu-tt"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.api.service_namespace
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 60
    scale_in_cooldown  = 120
    scale_out_cooldown = 60
  }
}
