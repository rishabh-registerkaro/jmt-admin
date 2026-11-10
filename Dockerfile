# Use Node.js official image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files and Prisma schema (postinstall runs `prisma generate`)
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "run", "start"]