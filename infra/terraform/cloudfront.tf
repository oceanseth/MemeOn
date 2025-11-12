resource "aws_cloudfront_function" "redirect_www" {
  name    = "memeon-redirect-www"
  runtime = "cloudfront-js-1.0"
  comment = "Redirect www.memeon.ai to memeon.ai"
  publish = true

  code = <<EOF
function handler(event) {
  var request = event.request;
  var headers = request.headers;
  var host = headers.host && headers.host.value;

  if (host && host.toLowerCase() === "${var.www_domain_name}") {
    var query = "";
    if (request.querystring) {
      var keys = Object.keys(request.querystring);
      if (keys.length > 0) {
        var pairs = [];
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var entry = request.querystring[key];
          if (!entry) {
            continue;
          }
          if (entry.multiValue && entry.multiValue.length > 0) {
            for (var j = 0; j < entry.multiValue.length; j++) {
              var mv = entry.multiValue[j];
              if (mv && mv.value) {
                pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(mv.value));
              }
            }
          } else if (entry.value) {
            pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(entry.value));
          }
        }
        if (pairs.length > 0) {
          query = "?" + pairs.join("&");
        }
      }
    }

    var response = {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        "location": { value: "https://${var.domain_name}" + request.uri + query }
      }
    };
    return response;
  }

  return request;
}
EOF
}

resource "aws_cloudfront_cache_policy" "static_assets" {
  name = "memeon-static-cache-policy"

  default_ttl = 86400
  max_ttl     = 31536000
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_cache_policy" "api" {
  name = "memeon-api-cache-policy"

  default_ttl = 0
  max_ttl     = 0
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = false
    enable_accept_encoding_gzip   = false

    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_origin_request_policy" "api" {
  name = "memeon-api-origin-request-policy"

  cookies_config {
    cookie_behavior = "none"
  }

  headers_config {
    header_behavior = "none"
  }

  query_strings_config {
    query_string_behavior = "all"
  }
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "memeon-site-oac"
  description                       = "Origin access control for MemeOn static site"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_acm_certificate" "site" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"
  subject_alternative_names = [
    var.www_domain_name
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Project = "MemeOn"
    Service = "Web"
  }
}

resource "aws_cloudfront_response_headers_policy" "security" {
  name = "memeon-security-headers"

  security_headers_config {
    content_type_options {
      override = true
    }

    frame_options {
      override = true
      frame_option = "DENY"
    }

    referrer_policy {
      override        = true
      referrer_policy = "strict-origin-when-cross-origin"
    }

    strict_transport_security {
      override            = true
      access_control_max_age_sec = 63072000
      include_subdomains  = true
      preload             = true
    }

    xss_protection {
      override   = true
      protection = true
      mode_block = true
    }
  }
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "MemeOn.ai static site and API"
  default_root_object = "index.html"

  aliases = [
    var.domain_name,
    var.www_domain_name
  ]

  origin {
    domain_name = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id   = "s3-site"

    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  origin {
    domain_name = replace(aws_apigatewayv2_api.http_api.api_endpoint, "https://", "")
    origin_id   = "api-gateway"
    origin_path = ""

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-site"
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = aws_cloudfront_cache_policy.static_assets.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.redirect_www.arn
    }
  }

  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "api-gateway"
    viewer_protocol_policy = "https-only"
    cache_policy_id        = aws_cloudfront_cache_policy.api.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.api.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate.site.arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  depends_on = [
    aws_acm_certificate_validation.site
  ]
}

