output "site_bucket" {
  value       = aws_s3_bucket.site.bucket
  description = "Name of the S3 bucket hosting the MemeOn frontend."
}

output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.site.domain_name
  description = "CloudFront distribution domain for the site."
}

output "api_gateway_url" {
  value       = aws_apigatewayv2_stage.prod.invoke_url
  description = "Invoke URL for the API Gateway HTTP API."
}

output "lambda_name" {
  value       = aws_lambda_function.api.function_name
  description = "Deployed Lambda function name."
}

