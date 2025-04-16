terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
# Assumes credentials are configured via environment variables,
# shared credentials file (~/.aws/credentials), or IAM role.
provider "aws" {
  region = "us-east-1" # You can change this to your preferred region
}

# Create an S3 bucket for the frontend static website
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "arjit-unique-website-frontend" # Use the name you provided

  tags = {
    Name        = "Frontend Static Website"
    Environment = "Production" # Or your desired environment
  }
}

# Configure the S3 bucket for static website hosting
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html" # Assuming you have an error.html in your build output
  }
}

# Configure public access block to allow public read access for website hosting
resource "aws_s3_bucket_public_access_block" "frontend_public_access" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Define a bucket policy to allow public read access to objects
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "PublicReadGetObject",
        Effect    = "Allow",
        Principal = "*",
        Action    = "s3:GetObject",
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      }
    ]
  })

  # Depend on the public access block being configured first
  depends_on = [aws_s3_bucket_public_access_block.frontend_public_access]
}

# Output the website endpoint URL
output "website_endpoint" {
  value = aws_s3_bucket_website_configuration.frontend_website.website_endpoint
  description = "The S3 bucket website endpoint URL"
}
