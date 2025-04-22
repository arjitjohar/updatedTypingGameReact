# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
RUN npm ci
# If you use yarn:
# RUN yarn install --frozen-lockfile

# Bundle app source
COPY . .

# Make port 3000 available to the world outside this container
# (This should match the PORT in your .env or server.js)
EXPOSE 3000

# Define environment variable (optional, can be overridden)
# ENV NODE_ENV production

# Run server.js when the container launches
CMD [ "node", "server.js" ]
