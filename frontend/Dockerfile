# frontend/Dockerfile
# Stage 1: Build React app
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Copy dependencies and install
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build React app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with lightweight Node server
FROM node:20-alpine

WORKDIR /usr/src/app

# Install serve globally
RUN npm install -g serve

# Copy build output
COPY --from=build /usr/src/app/dist ./dist

# Expose port
EXPOSE 3000

# Serve the app
CMD ["serve", "-s", "dist", "-l", "3000"]