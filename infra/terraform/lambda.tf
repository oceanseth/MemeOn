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
  name               = "memeon-api-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Project = "MemeOn"
    Service = "API"
  }
}

data "aws_iam_policy_document" "lambda_logs" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"]
  }
}

# app data access: dynamo single-table, ssm secrets, public assets bucket
data "aws_iam_policy_document" "lambda_data" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:TransactWriteItems",
      "dynamodb:ConditionCheckItem"
    ]
    resources = [
      "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/memeon-production",
      "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/memeon-production/index/*"
    ]
  }

  statement {
    effect    = "Allow"
    actions   = ["ssm:GetParameter"]
    resources = [
      "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/memeon/production/*",
      "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/memeon/shared/*",
    ]
  }

  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["arn:aws:s3:::memeon-assets-production/*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::memeon-assets-production"]
  }
}

resource "aws_iam_role_policy" "lambda_data" {
  name   = "memeon-api-data"
  role   = aws_iam_role.api_lambda.id
  policy = data.aws_iam_policy_document.lambda_data.json
}

resource "aws_iam_role_policy" "lambda_logs" {
  name   = "memeon-api-logs"
  role   = aws_iam_role.api_lambda.id
  policy = data.aws_iam_policy_document.lambda_logs.json
}

data "aws_caller_identity" "current" {}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/memeon-api"
  retention_in_days = 30
}

resource "aws_lambda_function" "api" {
  function_name = "memeon-api"
  role          = aws_iam_role.api_lambda.arn
  runtime       = "nodejs20.x"
  handler       = "dist/handler.handler"
  architectures = ["arm64"]
  memory_size   = 1024
  timeout       = 28

  filename         = var.api_lambda_package
  source_code_hash = filebase64sha256(var.api_lambda_package)

  environment {
    variables = {
      TABLE_NAME    = "memeon-production"
      SSM_PREFIX    = "/memeon/production"
      ASSETS_BUCKET = "memeon-assets-production"
      SITE_ORIGIN   = "https://memeon.ai"
    }
  }

  logging_config {
    log_format     = "JSON"
    application_log_level = "INFO"
  }

  depends_on = [
    aws_iam_role_policy.lambda_logs
  ]
}

