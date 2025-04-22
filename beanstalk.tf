# --- Elastic Beanstalk Application ---
# Defines the container for your application versions and environments.

resource "aws_elastic_beanstalk_application" "typing_game_backend_app" {
  name        = "TypingGameBackend" # Choose a name for your EB Application
  description = "Backend API for the Typing Game"

  tags = {
    Name        = "TypingGameBackendApp"
    Environment = "Production" # Or your specific environment
  }
}

# --- IAM Role and Instance Profile for Beanstalk EC2 Instances ---
# This role allows the EC2 instances running your app to access other AWS services (DynamoDB, etc.)

resource "aws_iam_role" "eb_instance_role" {
  name = "eb-typing-game-instance-role"

  # Policy allowing EC2 instances to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "EBInstanceRole-TypingGame"
  }
}

# Attach necessary policies to the instance role
# WARNING: AmazonDynamoDBFullAccess is overly permissive for production.
# Create a custom policy with least privilege access (e.g., only PutItem, Query on specific tables/indexes).
resource "aws_iam_role_policy_attachment" "eb_instance_dynamodb_policy" {
  role       = aws_iam_role.eb_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess" # SCOPE DOWN FOR PRODUCTION!
}

# Policy required for basic Beanstalk functionality and monitoring
resource "aws_iam_role_policy_attachment" "eb_instance_web_tier_policy" {
  role       = aws_iam_role.eb_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

# Policy for enhanced health reporting and log streaming (optional but recommended)
resource "aws_iam_role_policy_attachment" "eb_instance_enhanced_health_policy" {
  role       = aws_iam_role.eb_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkEnhancedHealth"
}

# Create an instance profile to attach the role to EC2 instances
resource "aws_iam_instance_profile" "eb_instance_profile" {
  name = "eb-typing-game-instance-profile"
  role = aws_iam_role.eb_instance_role.name
}

# --- DynamoDB Table for Sessions (connect-dynamodb) ---
# Ensure this resource definition exists in your Terraform configuration
# (Could be in this file or another like dynamodb.tf)
resource "aws_dynamodb_table" "typing_game_sessions" {
  name           = "TypingGameSessions" # Name for the session table
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"                 # connect-dynamodb uses 'id' as the session ID key

  attribute {
    name = "id"
    type = "S" # Session ID is a string
  }

  # Enable Point-in-Time Recovery for backups
  point_in_time_recovery {
    enabled = true
  }

  # Enable server-side encryption (recommended)
  server_side_encryption {
    enabled = true
  }

  # Optional: Time To Live (TTL) configuration to automatically delete expired sessions
  # ttl {
  #   attribute_name = "expires" # connect-dynamodb uses 'expires' attribute (Unix timestamp)
  #   enabled        = true
  # }

  tags = {
    Name        = "TypingGameSessions"
    Environment = "Production" # Or your desired environment
    Purpose     = "Session Storage for Backend"
  }
}


# --- Elastic Beanstalk Environment ---
# Defines the running environment for your application code.

# Note: You need an ACM certificate ARN for your backend API domain (e.g., api.arjitjohar.com)
# Replace "YOUR_ACM_CERTIFICATE_ARN" with the actual ARN.
variable "backend_acm_certificate_arn" {
  type        = string
  description = "ARN of the ACM certificate for the backend API domain (e.g., api.arjitjohar.com)"
  # default = "arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id" # Example - Provide the real one
}

# Variable for the frontend URL needed by the backend
variable "frontend_url" {
  type        = string
  description = "The production URL of the frontend (e.g., https://arjitjohar.com)"
  default     = "https://arjitjohar.com" # Set your default or pass via tfvars
}

# Variable for the session secret
variable "session_secret" {
  type        = string
  description = "The secret key for express-session"
  sensitive   = true # Mark as sensitive
  # No default, should be provided securely (e.g., via TF_VAR_session_secret env var or tfvars file)
}

# Add variables for Google OAuth credentials (also sensitive)
variable "google_client_id" {
  type        = string
  description = "Google OAuth Client ID"
  sensitive   = true
}

variable "google_client_secret" {
  type        = string
  description = "Google OAuth Client Secret"
  sensitive   = true
}


resource "aws_elastic_beanstalk_environment" "typing_game_backend_env" {
  name                = "TypingGameBackend-prod" # Choose a name for the environment
  application         = aws_elastic_beanstalk_application.typing_game_backend_app.name
  # Find the latest Node.js platform ARN for your region:
  # https://docs.aws.amazon.com/elasticbeanstalk/latest/platforms/platforms-supported.html#platforms-supported.nodejs
  # Example for Node.js 18 on Amazon Linux 2023:
  solution_stack_name = "64bit Amazon Linux 2023 v4.1.1 running Node.js 18" # UPDATE AS NEEDED

  # --- Configuration Settings (using repeatable 'setting' blocks) ---

  # Environment Variables
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "NODE_ENV"
    value     = "production"
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "PORT" # Beanstalk typically uses 8080 by default for Node.js
    value     = "8080"
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AWS_REGION"
    value     = "us-east-1" # Or your region
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "FRONTEND_URL"
    value     = var.frontend_url
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SESSION_SECRET"
    value     = var.session_secret # Pass sensitive variable
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "GOOGLE_CLIENT_ID"
    value     = var.google_client_id
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "GOOGLE_CLIENT_SECRET"
    value     = var.google_client_secret
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DYNAMODB_TABLE_USERS"
    value     = aws_dynamodb_table.typing_game_users.name # Reference existing table
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DYNAMODB_TABLE_TEXTS"
    value     = aws_dynamodb_table.typing_texts.name # Reference new table
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DYNAMODB_GSI_WPM"
    value     = "WpmLeaderboardIndex" # Reference GSI name
  }
  # *** CORRECTED: Pass the session table name as an environment variable ***
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DYNAMODB_TABLE_SESSIONS" # Use the correct env var name
    value     = aws_dynamodb_table.typing_game_sessions.name # Reference session table resource
  }

  # Instance Role and Profile
  setting {
    namespace   = "aws:autoscaling:launchconfiguration"
    name        = "IamInstanceProfile"
    value       = aws_iam_instance_profile.eb_instance_profile.name # Reference the Instance Profile name
  }

  # Load Balancer Configuration
  setting {
    namespace   = "aws:elasticbeanstalk:environment"
    name        = "EnvironmentType"
    value       = "LoadBalanced"
  }
  setting {
    namespace   = "aws:elasticbeanstalk:environment"
    name        = "LoadBalancerType"
    value       = "application"
  }
  setting {
    namespace   = "aws:elbv2:listener:443"
    name        = "Protocol"
    value       = "HTTPS"
  }
  setting {
    namespace   = "aws:elbv2:listener:443"
    name        = "SSLCertificateArns"
    value       = var.backend_acm_certificate_arn # Use the certificate ARN variable
  }
  # Optional: Redirect HTTP to HTTPS settings would also use individual 'setting' blocks here

  # Instance Configuration
  setting {
    namespace   = "aws:autoscaling:launchconfiguration"
    name        = "InstanceType"
    value       = "t3.micro" # Choose an appropriate instance type
  }

  # Health Reporting
  setting {
     namespace  = "aws:elasticbeanstalk:healthreporting:system"
     name       = "SystemType"
     value      = "enhanced"
  }
  setting {
     namespace  = "aws:elasticbeanstalk:application"
     name       = "Application Healthcheck URL"
     value      = "/health" # Define a /health endpoint in your Node.js app
  }

  # Rolling Updates
  setting {
     namespace  = "aws:elasticbeanstalk:command"
     name       = "DeploymentPolicy"
     value      = "Rolling"
  }
  setting {
     namespace  = "aws:elasticbeanstalk:command"
     name       = "BatchSizeType"
     value      = "30" # Percentage
  }

  tags = {
    Name        = "TypingGameBackendEnv-Prod"
    Environment = "Production" # Or your specific environment
  }

  # Wait for the instance profile to be ready before creating the environment
  depends_on = [aws_iam_instance_profile.eb_instance_profile]
}

# --- Output the Beanstalk Environment URL ---
output "beanstalk_environment_url" {
  value       = aws_elastic_beanstalk_environment.typing_game_backend_env.cname
  description = "The CNAME URL of the Elastic Beanstalk environment"
}

# --- Output the Session Table Name ---
output "session_table_name" {
  value = aws_dynamodb_table.typing_game_sessions.name
  description = "Name of the DynamoDB table used for session storage"
}
