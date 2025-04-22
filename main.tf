terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "bucket_name" {
  type = string
  description = "The name of the S3 bucket"
  default = "arjit-unique-website-frontend"
}

# Configure the AWS Provider
# Assumes credentials are configured via environment variables,
# shared credentials file (~/.aws/credentials), or IAM role.
provider "aws" {
  region = "us-east-1" # You can change this to your preferred region
}

# Create an S3 bucket for the frontend static website
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.bucket_name # Use the name you provided

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

# Create a DynamoDB table for user data and game stats
resource "aws_dynamodb_table" "typing_game_users" {
  name           = "TypingGameUsers"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "UserID" # Partition Key
  range_key      = "DataType" # Sort Key

  attribute {
    name = "UserID"
    type = "S" # String type for the user sub
  }

  attribute {
    name = "DataType"
    type = "S" # String type for distinguishing data (e.g., PROFILE, STAT#timestamp)
  }

  # --- GSI Attributes (Must be defined here if used as GSI keys) ---
  attribute {
    name = "GSIPK" # Attribute for GSI Partition Key (e.g., "STAT_RECORD")
    type = "S"
  }
  attribute {
    name = "WPM" # Attribute for GSI Sort Key (Words Per Minute)
    type = "N"  # WPM should be stored as a number for sorting
  }
  # Note: Attributes like DateAchieved, TextID, Name etc., used only for projection
  # do NOT need to be defined in the top-level 'attribute' blocks.

  tags = {
    Name        = "TypingGameUsers"
    Environment = "Production" # Or your desired environment
  }

  # --- Global Secondary Index for Leaderboard ---
  global_secondary_index {
    name            = "WpmLeaderboardIndex" # Choose a descriptive name
    hash_key        = "GSIPK"               # Partition Key for the GSI
    range_key       = "WPM"                 # Sort Key for the GSI (to sort by score)
    projection_type = "INCLUDE"             # Project only specific needed attributes

    # List attributes needed for the leaderboard display
    non_key_attributes = [
      "UserID",
      "DateAchieved",
      "TextID",
      "Name" # Include Name if you plan to denormalize it onto the STAT item later
             # Otherwise, you'll fetch it separately based on UserID
    ]
    # Billing mode for GSI inherits from the table's billing_mode (PAY_PER_REQUEST)
  }
}

# Output the DynamoDB table name
output "dynamodb_table_name" {
  value = aws_dynamodb_table.typing_game_users.name
  description = "The name of the DynamoDB table"
}

# Output the DynamoDB table ARN (useful for IAM policies)
output "dynamodb_table_arn" {
  value       = aws_dynamodb_table.typing_game_users.arn
  description = "The ARN of the DynamoDB table"
}

# Output the GSI name (useful for backend code)
output "dynamodb_gsi_name" {
  value       = "WpmLeaderboardIndex" # Must match the GSI name defined above
  description = "The name of the WPM Leaderboard GSI"
}
