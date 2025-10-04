# Use official Node.js 18 LTS image as the base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package definitions and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application source
COPY . .

# Expose the port used by the Express server
EXPOSE 3000

# Define the command to start the application
CMD ["npm", "start"]
