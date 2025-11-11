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
  memory_size   = 128
  timeout       = 5

  filename         = var.api_lambda_package
  source_code_hash = filebase64sha256(var.api_lambda_package)

  logging_config {
    log_format     = "JSON"
    application_log_level = "INFO"
  }

  depends_on = [
    aws_iam_role_policy.lambda_logs
  ]
}

