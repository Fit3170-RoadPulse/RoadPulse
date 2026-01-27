# frontend-admin/Dockerfile
# Stage 1: Build the React app
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy source code and build
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve the built app
FROM node:20-alpine

WORKDIR /usr/src/app

# Install a lightweight static server
RUN npm install -g serve

# Copy build output
COPY --from=build /usr/src/app/dist ./dist

# Expose port for the admin static server
EXPOSE 5174

# Serve the app
CMD ["serve", "-s", "dist", "-l", "5174"]
