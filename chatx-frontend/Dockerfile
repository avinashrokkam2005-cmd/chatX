# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build static artifacts
COPY . .
RUN npm run build

# Production Stage with Nginx
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Clean default html
RUN rm -rf ./*

# Copy built frontend assets
COPY --from=builder /app/dist ./

# Copy custom Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
