# dev.memeon.ai stack — a scaled-down mirror of the production infra in ../.
# Separate terraform root + state so dev can be applied without prod's state.
# CI (deploy-dev.yml) only syncs build artifacts; this root owns the resources.

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.65"
    }
  }
}

provider "aws" {
  region = "us-west-2"
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

variable "domain_name" {
  type    = string
  default = "dev.memeon.ai"
}

variable "route53_zone_id" {
  type    = string
  default = "Z0392700C8TH00WHHACM"
}

variable "api_lambda_package" {
  type    = string
  default = "../../../api/lambda.zip"
}

data "aws_caller_identity" "current" {}

# ---------- data ----------
# The DynamoDB table (memeon-dev) and assets bucket (memeon-assets-dev) are
# created outside terraform (shared with local dev); referenced by name below.

# ---------- lambda ----------

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "api_lambda" {
  name               = "memeon-api-dev-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

data "aws_iam_policy_document" "lambda_permissions" {
  statement {
    effect    = "Allow"
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:us-west-2:${data.aws_caller_identity.current.account_id}:*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem",
      "dynamodb:Query", "dynamodb:TransactWriteItems", "dynamodb:ConditionCheckItem"
    ]
    resources = [
      "arn:aws:dynamodb:us-west-2:${data.aws_caller_identity.current.account_id}:table/memeon-dev",
      "arn:aws:dynamodb:us-west-2:${data.aws_caller_identity.current.account_id}:table/memeon-dev/index/*"
    ]
  }

  statement {
    effect    = "Allow"
    actions   = ["ssm:GetParameter"]
    resources = [
      "arn:aws:ssm:us-west-2:${data.aws_caller_identity.current.account_id}:parameter/memeon/dev/*",
      "arn:aws:ssm:us-west-2:${data.aws_caller_identity.current.account_id}:parameter/memeon/shared/*",
    ]
  }

  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["arn:aws:s3:::memeon-assets-dev/*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::memeon-assets-dev"]
  }
}

resource "aws_iam_role_policy" "lambda_permissions" {
  name   = "memeon-api-dev-permissions"
  role   = aws_iam_role.api_lambda.id
  policy = data.aws_iam_policy_document.lambda_permissions.json
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/memeon-api-dev"
  retention_in_days = 14
}

resource "aws_lambda_function" "api" {
  function_name = "memeon-api-dev"
  role          = aws_iam_role.api_lambda.arn
  runtime       = "nodejs20.x"
  handler       = "dist/handler.handler"
  architectures = ["arm64"]
  memory_size   = 512
  timeout       = 20

  filename         = var.api_lambda_package
  source_code_hash = filebase64sha256(var.api_lambda_package)

  environment {
    variables = {
      TABLE_NAME    = "memeon-dev"
      SSM_PREFIX    = "/memeon/dev"
      ASSETS_BUCKET = "memeon-assets-dev"
      SITE_ORIGIN   = "https://${var.domain_name}"
    }
  }

  lifecycle {
    # CI owns the code after first apply
    ignore_changes = [filename, source_code_hash]
  }

  depends_on = [aws_iam_role_policy.lambda_permissions]
}

# ---------- api gateway ----------

resource "aws_apigatewayv2_api" "http_api" {
  name          = "memeon-http-api-dev"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["https://${var.domain_name}", "http://localhost:5173"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 25000
}

resource "aws_apigatewayv2_route" "api_proxy" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "helloworld" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/helloworld"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "meme_share" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /m/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 50
    throttling_rate_limit  = 25
  }
}

resource "aws_lambda_permission" "apigateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# ---------- site bucket ----------

resource "aws_s3_bucket" "site" {
  bucket        = var.domain_name
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "site_bucket" {
  statement {
    sid    = "AllowCloudFrontServicePrincipalRead"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions   = ["s3:GetObject", "s3:ListBucket"]
    resources = [aws_s3_bucket.site.arn, "${aws_s3_bucket.site.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_bucket.json
}

# ---------- certificate ----------

resource "aws_acm_certificate" "site" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.site.domain_validation_options :
    dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }

  zone_id = var.route53_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.value]
}

resource "aws_acm_certificate_validation" "site" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# ---------- cloudfront ----------

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "memeon-dev-site-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "spa_rewrite" {
  name    = "memeon-dev-spa-rewrite"
  runtime = "cloudfront-js-1.0"
  comment = "SPA rewrite for dev.memeon.ai"
  publish = true

  code = <<EOF
function handler(event) {
  var request = event.request;
  var uri = request.uri || "/";
  if (uri !== "/" && uri.indexOf(".") === -1) {
    request.uri = "/index.html";
  }
  return request;
}
EOF
}

locals {
  # managed prod policies, reused by id (created by the prod stack)
  cache_policy_static = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized (managed)
  cache_policy_api    = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled (managed)
  origin_req_api      = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AllViewerExceptHostHeader (managed)
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "MemeOn dev site and API"
  default_root_object = "index.html"
  aliases             = [var.domain_name]

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-site"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  origin {
    domain_name = replace(aws_apigatewayv2_api.http_api.api_endpoint, "https://", "")
    origin_id   = "api-gateway"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-site"
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = local.cache_policy_static

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_rewrite.arn
    }
  }

  ordered_cache_behavior {
    path_pattern             = "/api/*"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = "api-gateway"
    viewer_protocol_policy   = "https-only"
    cache_policy_id          = local.cache_policy_api
    origin_request_policy_id = local.origin_req_api
  }

  ordered_cache_behavior {
    path_pattern             = "/m/*"
    allowed_methods          = ["GET", "HEAD"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = "api-gateway"
    viewer_protocol_policy   = "redirect-to-https"
    cache_policy_id          = local.cache_policy_api
    origin_request_policy_id = local.origin_req_api
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.site.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  depends_on = [aws_acm_certificate_validation.site]
}

# ---------- dns ----------

resource "aws_route53_record" "site" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "site_ipv6" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

# ---------- outputs ----------

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.site.domain_name
}

output "api_gateway_id" {
  value = aws_apigatewayv2_api.http_api.id
}

output "site_bucket" {
  value = aws_s3_bucket.site.bucket
}

output "lambda_name" {
  value = aws_lambda_function.api.function_name
}
