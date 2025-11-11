variable "aws_region" {
  description = "AWS region for regional resources (Lambda, API Gateway, S3). ACM certificate for CloudFront is always created in us-east-1."
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "Root domain for the MemeOn.ai site."
  type        = string
  default     = "memeon.ai"
}

variable "www_domain_name" {
  description = "Alternate domain that redirects to the root."
  type        = string
  default     = "www.memeon.ai"
}

variable "site_bucket_name" {
  description = "S3 bucket name used to store the built frontend assets."
  type        = string
  default     = "memeon.ai"
}

variable "api_lambda_package" {
  description = "Path to the zipped Lambda bundle generated from the api workspace (`npm run bundle:api`)."
  type        = string
  default     = "../../api/lambda.zip"
}

variable "route53_zone_id" {
  description = "Hosted zone ID in Route53 for the MemeOn.ai domain."
  type        = string
}

