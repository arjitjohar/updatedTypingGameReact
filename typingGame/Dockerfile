# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all application files to the container
COPY . .

# Expose the port used by Vite's development server
EXPOSE 5173

# Start Vite dev server with proper host configuration
CMD ["npm", "run", "dev", "--", "--host"]
