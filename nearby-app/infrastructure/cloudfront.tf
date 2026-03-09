# Terraform configuration for CloudFront distributions
# This creates HTTPS-enabled CloudFront distributions for all three apps

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

# CloudFront distribution for Customer App
resource "aws_cloudfront_distribution" "customer_app" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Customer App Distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"

  origin {
    domain_name = "nearby-customer-app.s3-website.ap-south-1.amazonaws.com"
    origin_id   = "S3-nearby-customer-app"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-nearby-customer-app"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "nearby-customer-app"
    Environment = "production"
  }
}

# CloudFront distribution for Merchant App
resource "aws_cloudfront_distribution" "merchant_app" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Merchant App Distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"

  origin {
    domain_name = "nearby-merchant-app.s3-website.ap-south-1.amazonaws.com"
    origin_id   = "S3-nearby-merchant-app"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-nearby-merchant-app"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "nearby-merchant-app"
    Environment = "production"
  }
}

# CloudFront distribution for Admin App
resource "aws_cloudfront_distribution" "admin_app" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Admin App Distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"

  origin {
    domain_name = "nearby-admin-app.s3-website.ap-south-1.amazonaws.com"
    origin_id   = "S3-nearby-admin-app"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-nearby-admin-app"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "nearby-admin-app"
    Environment = "production"
  }
}

# Outputs
output "customer_app_cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.customer_app.domain_name}"
  description = "Customer App CloudFront URL"
}

output "merchant_app_cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.merchant_app.domain_name}"
  description = "Merchant App CloudFront URL"
}

output "admin_app_cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.admin_app.domain_name}"
  description = "Admin App CloudFront URL"
}

output "customer_app_distribution_id" {
  value       = aws_cloudfront_distribution.customer_app.id
  description = "Customer App CloudFront Distribution ID"
}

output "merchant_app_distribution_id" {
  value       = aws_cloudfront_distribution.merchant_app.id
  description = "Merchant App CloudFront Distribution ID"
}

output "admin_app_distribution_id" {
  value       = aws_cloudfront_distribution.admin_app.id
  description = "Admin App CloudFront Distribution ID"
}
