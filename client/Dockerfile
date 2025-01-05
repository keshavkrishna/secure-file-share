# Use Node.js official image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the Next.js app
COPY . .

# Expose the port for Next.js
EXPOSE 3001

# Start the Next.js development server
CMD ["npm", "run", "dev"]
