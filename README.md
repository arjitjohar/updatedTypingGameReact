# POC typing game for my website arjitjohar.com deployed and managed with AWS. 

## development instructions:
- create .env file in the root directory which includes:
```
GOOGLE_CLIENT_ID=""
PORT=
FRONTEND_URL=""
GOOGLE_CLIENT_SECRET=""
SESSION_SECRET=""
BACKEND_CALLBACK_URL="http://localhost:3000/auth/google/callback"
VITE_BACKEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3000"
S3_BUCKET_NAME=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
```
- start the docker containers with docker compose up --build
- open localhost:5173 to see the application running

