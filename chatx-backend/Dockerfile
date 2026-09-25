# Build Stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy POM and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build package
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user and uploads directory
RUN addgroup -S chatx && adduser -S chatx -G chatx && \
    mkdir -p /app/uploads && chown -R chatx:chatx /app

USER chatx

# Copy built JAR from builder stage
COPY --from=builder /app/target/chatx-backend-*.jar app.jar

# Configuration environment variables
ENV SPRING_PROFILES_ACTIVE=prod \
    CHATX_SERVER_PORT=8080 \
    CHATX_DB_HOST=mysql \
    CHATX_DB_PORT=3306 \
    CHATX_DB_NAME=chatx_db \
    CHATX_DB_USERNAME=chatx_user \
    CHATX_DB_PASSWORD=chatx_pass \
    CHATX_REDIS_HOST=redis \
    CHATX_REDIS_PORT=6379 \
    CHATX_UPLOAD_DIR=/app/uploads

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
