# Use a Node.js base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy all files into the container
COPY package.json .

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the production files
RUN npm run build

# Serve the app
EXPOSE 3000
CMD ["npm", "start"]
