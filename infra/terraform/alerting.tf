# Failure alerting: CloudWatch -> SNS -> bridge Lambda -> Buzz #memeon-alerts.
#
# Mirrors resources CLI-applied 2026-10-08 (per README, re-import before apply).
# The Lambda JSON log format makes $.level filterable: handler.ts logs 4xx as
# WARN (visible, never pages) and 5xx/unhandled as ERROR (pages). The bridge
# posts alarm transitions into the Buzz channel memeon-alerts
# (c15a253c-9587-4fa2-bd66-1a374afcce4f on wss://buzz.masky.ai), signing as a
# dedicated bot identity (SSM /memeon/alerts/nostr-key + /memeon/alerts/auth-tag,
# the latter an owner-minted NIP-OA attestation).

resource "aws_sns_topic" "alerts" {
  name = "memeon-alerts"
}

resource "aws_cloudwatch_log_metric_filter" "api_errors" {
  name           = "memeon-api-error-level"
  log_group_name = aws_cloudwatch_log_group.api.name
  pattern        = "{ $.level = \"ERROR\" }"

  metric_transformation {
    name          = "MemeonApiErrors"
    namespace     = "Memeon"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "apigw_5xx" {
  name           = "memeon-apigw-5xx"
  log_group_name = aws_cloudwatch_log_group.apigw_access.name
  pattern        = "{ $.status = \"5*\" }"

  metric_transformation {
    name          = "MemeonApiGw5xx"
    namespace     = "Memeon"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "memeon-api-errors"
  alarm_description   = "prod Lambda logged an ERROR-level line"
  namespace           = "Memeon"
  metric_name         = "MemeonApiErrors"
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "apigw_5xx" {
  alarm_name          = "memeon-apigw-5xx"
  alarm_description   = "prod API Gateway returned a 5xx"
  namespace           = "Memeon"
  metric_name         = "MemeonApiGw5xx"
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

# ---------- buzz bridge ----------

resource "aws_iam_role" "alerts_bridge" {
  name               = "memeon-alerts-bridge-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

data "aws_iam_policy_document" "alerts_bridge" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"]
  }

  # the bridge enriches alerts with the most recent matching log lines
  statement {
    effect  = "Allow"
    actions = ["logs:FilterLogEvents"]
    resources = [
      "${aws_cloudwatch_log_group.api.arn}:*",
      "${aws_cloudwatch_log_group.apigw_access.arn}:*",
      "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/memeon-api-dev:*",
    ]
  }

  statement {
    effect    = "Allow"
    actions   = ["ssm:GetParameter"]
    resources = ["arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/memeon/alerts/*"]
  }
}

resource "aws_iam_role_policy" "alerts_bridge" {
  name   = "memeon-alerts-bridge"
  role   = aws_iam_role.alerts_bridge.id
  policy = data.aws_iam_policy_document.alerts_bridge.json
}

# source: nest .scratch/memeon-alerts/bridge (esbuild-bundled index.mjs);
# deployed zip uploaded via CLI — terraform documents shape, not code
resource "aws_lambda_function" "alerts_bridge" {
  function_name = "memeon-alerts-bridge"
  role          = aws_iam_role.alerts_bridge.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  architectures = ["arm64"]
  memory_size   = 256
  timeout       = 30

  filename         = "bridge.zip"
  source_code_hash = ""

  environment {
    variables = {
      RELAY_URL  = "wss://buzz.masky.ai"
      CHANNEL_ID = "c15a253c-9587-4fa2-bd66-1a374afcce4f"
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_lambda_permission" "alerts_bridge_sns" {
  statement_id  = "sns-invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alerts_bridge.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alerts.arn
}

resource "aws_sns_topic_subscription" "alerts_bridge" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.alerts_bridge.arn
}
