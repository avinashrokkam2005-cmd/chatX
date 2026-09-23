# ChatX — Production-Style Real-Time Messaging Platform

ChatX is a modular monolithic real-time social communication platform built with Spring Boot 3, React (Vite + TypeScript), MySQL 8, and Redis.

## Technology Stack

- **Backend**: Java 21, Spring Boot 3.3.4, Spring Security 6, JWT, Spring Data JPA, Hibernate, WebSocket + STOMP, Maven
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, `@stomp/stompjs`, Lucide React
- **Database**: MySQL 8.0 (InnoDB, UTF8mb4)
- **Cache & Ephemeral State**: Redis 7 (Presence, Typing indicators, Rate limiting)

## Project Structure

```text
d:/ChatX/
├── chatx-backend/          # Spring Boot modular monolith backend
├── chatx-frontend/         # React + Vite + TypeScript frontend
├── docker-compose.yml      # Local dev environment (MySQL 8 + Redis 7)
└── README.md
```

## Getting Started

### 1. Start Infrastructure (MySQL + Redis)
```bash
docker-compose up -d
```

### 2. Run Backend
```bash
cd chatx-backend
mvn spring-boot:run
```
Swagger UI documentation available at: `http://localhost:8080/swagger-ui.html`

### 3. Run Frontend
```bash
cd chatx-frontend
npm install
npm run dev
```
Client UI available at: `http://localhost:5173`
