# ChatX Backend — Modular Monolithic Real-Time API Engine

[![Spring Boot 3](https://img.shields.io/badge/Spring_Boot-3.3.4-6DB33F?logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java 21](https://img.shields.io/badge/Java-21%20LTS-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![MySQL 8](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis 7](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203-85EA2D?logo=swagger&logoColor=black)](https://swagger.io/)

The **ChatX Backend** is an enterprise-grade, modular monolithic server application engineered with **Spring Boot 3.3.4** and **Java 21**. It delivers secure, low-latency REST APIs and full-duplex STOMP over WebSocket communication for users, conversations, media uploads, and moderation.

---

## 📑 Table of Contents

- [1. Architecture & Design Principles](#1-architecture--design-principles)
- [2. Prerequisites & Requirements](#2-prerequisites--requirements)
- [3. Configuration Profiles](#3-configuration-profiles)
- [4. Step-by-Step Installation & Running](#4-step-by-step-installation--running)
  - [Option A: Standard Development (MySQL 8 + Redis 7)](#option-a-standard-development-mysql-8--redis-7)
  - [Option B: Zero-Dependency Rapid Dev (Embedded H2)](#option-b-zero-dependency-rapid-dev-embedded-h2)
- [5. Database Setup & Seeding](#5-database-setup--seeding)
- [6. Testing & Quality Assurance](#6-testing--quality-assurance)
- [7. API Documentation (Swagger / OpenAPI)](#7-api-documentation-swagger--openapi)
- [8. Real-Time STOMP Protocol Reference](#8-real-time-stomp-protocol-reference)
- [9. Directory & Domain Module Structure](#9-directory--domain-module-structure)
- [10. Standalone Docker Build](#10-standalone-docker-build)
- [11. Troubleshooting Common Issues](#11-troubleshooting-common-issues)

---

## 1. Architecture & Design Principles

- **Modular Monolith**: Strict package-by-feature domain boundaries (`auth`, `user`, `friendship`, `block`, `conversation`, `message`, `realtime`, `file`, `notification`, `report`, `admin`).
- **No Lombok Dependency**: Built with explicit, transparent, maintainable standard Java records and POJOs.
- **UUID Identifiers**: All entities use UUID v4 primary keys extending `BaseEntity` to prevent enumeration attacks.
- **Dual-Tier State Management**: Relational consistency in MySQL 8.0 (InnoDB) and high-throughput ephemeral presence in Redis 7.0.
- **Stateless JWT Security**: Spring Security 6 stateless filter chain with 15-minute access tokens and 7-day refresh tokens.
- **Cursor-Based Pagination**: Zero-drift message history pagination via composite indexing `(conversation_id, created_at DESC, id DESC)`.

---

## 2. Prerequisites & Requirements

Before running the backend, ensure your environment meets these specifications:

| Requirement | Supported Versions | Verification Command | Notes |
| :--- | :--- | :--- | :--- |
| **Java JDK** | Java 21 LTS or 25 LTS | `java -version` | Oracle JDK or Eclipse Temurin |
| **Apache Maven** | 3.9.0+ | `mvn -version` | Backend dependency & build manager |
| **MySQL** | 8.0+ | `mysql --version` | *(Not needed if running `local` profile)* |
| **Redis** | 7.0+ | `redis-cli --version` | *(Not needed if running `local` profile)* |
| **Docker** | Compose v2 | `docker compose version` | *(Optional helper for MySQL & Redis)* |

---

## 3. Configuration Profiles

ChatX backend provides 3 distinct Spring Boot execution profiles:

| Profile | Target Environment | Database | Redis | Default Port | DDL Mode |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`dev`** *(default)* | Local Developer Workstation | MySQL 8.0 (`localhost:3306`) | Redis 7 (`localhost:6379`) | `8088` | `update` |
| **`local`** | Quick Offline / Zero-Infra Dev | Embedded H2 (`./data/chatx_db`) | Disabled (In-memory fallback) | `8088` | `update` |
| **`prod`** | Docker & Cloud Deployments | MySQL Container / Cloud RDS | Redis Container / ElastiCache | `8080` | `validate` |

---

## 4. Step-by-Step Installation & Running

Navigate to the backend directory:
```bash
cd chatx-backend
```

### Option A: Standard Development (MySQL 8 + Redis 7)

This is the recommended mode for full functional fidelity.

#### 1. Start MySQL & Redis
You can run MySQL and Redis instantly using Docker from the project root:
```bash
# Run from repository root
docker compose up mysql redis -d
```
*Or ensure your locally installed MySQL and Redis services are running on ports 3306 and 6379 respectively.*

#### 2. Verify Database Exists
If using native MySQL, create the database and user:
```sql
CREATE DATABASE chatx_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'chatx_user'@'%' IDENTIFIED BY 'chatx_pass';
GRANT ALL PRIVILEGES ON chatx_db.* TO 'chatx_user'@'%';
FLUSH PRIVILEGES;
```

#### 3. Build the Application
```bash
mvn clean compile
```

#### 4. Run the Application
```bash
# Uses the 'dev' profile by default
mvn spring-boot:run
```
*The server will start on **`http://localhost:8088`**.*

---

### Option B: Zero-Dependency Rapid Dev (Embedded H2)

If you do not want to install Docker, MySQL, or Redis on your machine:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

- Data is automatically persisted to `./data/chatx_db.mv.db` using H2 in MySQL-compatible mode.
- Redis health checks are disabled; user presence falls back to in-memory state.
- H2 Web Console is available at: [http://localhost:8088/h2-console](http://localhost:8088/h2-console)
  - **JDBC URL**: `jdbc:h2:file:./data/chatx_db;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1;AUTO_SERVER=TRUE`
  - **Username**: `sa`
  - **Password**: *(leave blank)*

---

## 5. Database Setup & Seeding

### Auto-Schema Generation
In `dev` and `local` profiles, Hibernate automatically generates and updates tables on startup (`spring.jpa.hibernate.ddl-auto=update`).

### Seeded Super Admin Account
The backend automatically creates a default platform Super Administrator via [`DataInitializer.java`](file:///d:/ChatX/chatx-backend/src/main/java/com/chatx/common/config/DataInitializer.java) on the first boot:

- **Username**: `admin`
- **Email**: `admin@chatx.com`
- **Password**: `Admin@1234`
- **Role**: `ROLE_SUPER_ADMIN`
- **Account Status**: `ACTIVE`

Use this account to authenticate and explore administrative endpoints and moderation queues.

---

## 6. Testing & Quality Assurance

ChatX includes a complete suite of unit and integration tests covering security, entity mappings, business logic, and access rules:

```bash
# Run all tests
mvn test
```

**Test Coverage Summary: 43 Tests Run, 0 Failures, 0 Errors, 0 Skipped.**
- `AdminServiceTest` (7 tests) — System stats, user promotion, suspension, self-action locks.
- `AuthServiceTest` (6 tests) — Registration, JWT login, duplicate handle rejection.
- `MessageServiceTest` (5 tests) — Message lifecycle, cursor ordering, edits, soft-delete.
- `FriendshipServiceTest` (5 tests) — Canonical friend pairs, request workflows.
- `ConversationServiceTest` (5 tests) — Direct pair key uniqueness, group rooms.
- `BlockServiceTest` (3 tests) — Unidirectional blocks & automatic friendship severance.
- `ProfileServiceTest` (3 tests) — Profile queries & updates.
- `UserServiceTest` (3 tests) — Case-insensitive prefix search & privacy settings.
- `FileStorageServiceTest` (3 tests) — Path traversal prevention & MIME validation.
- `ReportServiceTest` (2 tests) — Abuse report filing & admin resolution.
- `ChatXApplicationTests` (1 test) — Spring application context bootstrap.

---

## 7. API Documentation (Swagger / OpenAPI)

Interactive Swagger UI documentation is automatically enabled in `dev` and `local` profiles:

- **Swagger UI**: [http://localhost:8088/swagger-ui.html](http://localhost:8088/swagger-ui.html)
- **OpenAPI JSON Spec**: [http://localhost:8088/v3/api-docs](http://localhost:8088/v3/api-docs)

### Core REST Endpoints Overview:

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Create new account |
| `/api/auth/login` | `POST` | Public | Obtain access & refresh JWTs |
| `/api/auth/refresh` | `POST` | Public | Refresh expired access token |
| `/api/profiles/me` | `GET` / `PUT` | `USER` | Get or update current user profile |
| `/api/users/search?q={term}` | `GET` | `USER` | Case-insensitive prefix search |
| `/api/friends` | `GET` | `USER` | List accepted friends |
| `/api/friends/requests/{userId}` | `POST` | `USER` | Send friend request |
| `/api/conversations` | `GET` | `USER` | List active conversations |
| `/api/conversations/direct/{userId}` | `POST` | `USER` | Get or create direct chat |
| `/api/messages/conversation/{id}` | `GET` | `USER` | Cursor-paginated message history |
| `/api/messages` | `POST` | `USER` | Send message (text/attachments) |
| `/api/files/upload` | `POST` | `USER` | Upload media attachment (up to 10MB) |
| `/api/reports` | `POST` | `USER` | File moderation report |
| `/api/admin/stats` | `GET` | `ADMIN+` | Platform health & user counts |
| `/api/admin/users` | `GET` | `ADMIN+` | Search and filter platform users |
| `/api/admin/users/{id}/status` | `PUT` | `ADMIN+` | Suspend or ban user account |
| `/api/admin/reports` | `GET` | `ADMIN+` | View abuse reports queue |
| `/api/admin/audit-logs` | `GET` | `ADMIN+` | Chronological audit log trail |

---

## 8. Real-Time STOMP Protocol Reference

- **WebSocket Handshake URL**: `ws://localhost:8088/ws`
- **Authentication**: Pass Bearer token in the STOMP `CONNECT` frame:
  ```text
  CONNECT
  Authorization:Bearer <JWT_ACCESS_TOKEN>
  ```

### Main Channel Destinations:
- `/topic/conversations/{conversationId}` — Inbound stream for messages, edits, deletes, and reactions.
- `/topic/presence` — Broadcasts online/offline status changes.
- `/user/queue/notifications` — Direct private user alerts (friend requests, system notices).
- `/app/conversations/{conversationId}/typing` — Client publishing destination for typing state.
- `/topic/conversations/{conversationId}/typing` — Broadcast destination for typing bubbles.

---

## 9. Directory & Domain Module Structure

```text
chatx-backend/
├── pom.xml
├── Dockerfile
└── src/
    ├── main/
    │   ├── java/com/chatx/
    │   │   ├── admin/           # Platform overview stats, user moderation, audit logs
    │   │   ├── auth/            # JWT provider, token validation filters, SecurityConfig
    │   │   ├── block/           # User blocking engine & friendship severance
    │   │   ├── common/          # GlobalExceptionHandler, ApiResponse, BaseEntity, DataInitializer
    │   │   ├── conversation/    # Direct conversation pairing & group membership
    │   │   ├── file/            # Local disk file storage, safe paths, MIME validation
    │   │   ├── friendship/      # Canonical friend pair table & pending request workflows
    │   │   ├── message/         # Message storage, reactions, edits, cursor pagination
    │   │   ├── notification/    # Push notifications & unread badge counters
    │   │   ├── realtime/        # STOMP broker configuration, interceptors, Redis presence
    │   │   ├── report/          # Content & user moderation reports
    │   │   ├── user/            # User account entity, BCrypt passwords, prefix search
    │   │   └── ChatXApplication.java  # Main application entrypoint
    │   └── resources/
    │       ├── application.yml        # Shared defaults & ChatX configuration tokens
    │       ├── application-dev.yml    # Dev profile (MySQL 8 + Redis on port 8088)
    │       ├── application-local.yml  # Local zero-infra profile (Embedded H2 on port 8088)
    │       └── application-prod.yml   # Production Docker profile (port 8080)
    └── test/                    # Full automated test suite (43 tests)
```

---

## 10. Standalone Docker Build

To package and run the backend as an isolated Docker container:

```bash
# Build the Docker image
docker build -t chatx-backend:latest .

# Run container (requires MySQL and Redis network connectivity)
docker run -p 8080:8080 \
  -e CHATX_DB_HOST=host.docker.internal \
  -e CHATX_REDIS_HOST=host.docker.internal \
  chatx-backend:latest
```

---

## 11. Troubleshooting Common Issues

### Issue 1: Port 8088 Already Bound
- **Cause**: Another backend instance or application is already listening on port 8088.
- **Fix (Windows)**:
  ```powershell
  netstat -ano | findstr :8088
  taskkill /PID <PID> /F
  ```
- **Fix (Linux/macOS)**:
  ```bash
  lsof -ti :8088 | xargs kill -9
  ```

### Issue 2: MySQL Connection Refused
- **Cause**: MySQL server is not running on `localhost:3306`.
- **Fix**: Launch MySQL via Docker (`docker compose up mysql -d` from project root) or switch to the embedded H2 profile (`-Dspring-boot.run.profiles=local`).

### Issue 3: Redis Connection Timeout
- **Cause**: Redis server is not listening on `localhost:6379`.
- **Fix**: Launch Redis via Docker (`docker compose up redis -d` from root) or run with profile `local`.
