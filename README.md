# ChatX — Production-Grade Real-Time Messaging Platform

[![Spring Boot 3](https://img.shields.io/badge/Spring_Boot-3.3.4-6DB33F?logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java 21/25](https://img.shields.io/badge/Java-21%20%7C%2025-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MySQL 8](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis 7](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

ChatX is a high-performance, modular monolithic social communication platform engineered for secure, low-latency, real-time messaging between users and groups. Designed from the ground up according to clean architecture, domain-driven boundaries, and enterprise security principles, ChatX eliminates microservice network overhead while delivering high scalability and maintainability.

---

## 📑 Table of Contents

- [1. Product Vision & Architecture](#1-product-vision--architecture)
  - [Architectural Philosophy](#architectural-philosophy)
  - [High-Level Architecture Diagram](#high-level-architecture-diagram)
  - [Domain Modules](#domain-modules)
- [2. Tech Stack](#2-tech-stack)
- [3. Core System Features](#3-core-system-features)
  - [Identity & Security Model](#identity--security-model)
  - [User Profiles & Case-Insensitive Search](#user-profiles--case-insensitive-search)
  - [Friend System & Canonical Uniqueness](#friend-system--canonical-uniqueness)
  - [Unidirectional Block Enforcement](#unidirectional-block-enforcement)
  - [Direct & Group Conversations](#direct--group-conversations)
  - [Messaging Engine & Cursor Pagination](#messaging-engine--cursor-pagination)
  - [Real-Time WebSocket & STOMP Protocol](#real-time-websocket--stomp-protocol)
  - [File Storage & Media Attachments](#file-storage--media-attachments)
  - [Notifications & Moderation System](#notifications--moderation-system)
  - [Admin Dashboard & Audit Logging](#admin-dashboard--audit-logging)
- [4. Database Design & Schema Highlights](#4-database-design--schema-highlights)
- [5. Real-Time STOMP Protocol Reference](#5-real-time-stomp-protocol-reference)
- [6. REST API Reference](#6-rest-api-reference)
- [7. Getting Started & Installation](#7-getting-started--installation)
  - [Prerequisites & System Matrix](#prerequisites--system-matrix)
  - [Mode 1: One-Command Full Stack (Docker Compose)](#mode-1-one-command-full-stack-docker-compose)
  - [Mode 2: Backend Standalone Installation & Running](#mode-2-backend-standalone-installation--running)
    - [Option 2A: Standalone with MySQL 8.0 & Redis 7.0](#option-2a-standalone-with-mysql-80--redis-70)
    - [Option 2B: Zero-Dependency Rapid Dev (Embedded H2)](#option-2b-zero-dependency-rapid-dev-embedded-h2)
  - [Mode 3: Frontend Standalone Installation & Running](#mode-3-frontend-standalone-installation--running)
  - [Mode 4: Combined Local Development (Side-by-Side)](#mode-4-combined-local-development-side-by-side)
  - [Default Seeded Credentials & Verification](#default-seeded-credentials--verification)
  - [Development Port & Communication Map](#development-port--communication-map)
  - [Troubleshooting & Common Issues](#troubleshooting--common-issues)
- [8. Environment Variables Reference](#8-environment-variables-reference)
- [9. Testing & Quality Assurance](#9-testing--quality-assurance)
- [10. Production Deployment Guidelines](#10-production-deployment-guidelines)
- [11. Repository Structure](#11-repository-structure)

---

## 1. Product Vision & Architecture

ChatX is designed for community and team communications where users establish permanent identities via UUIDs, claim unique case-insensitive usernames (`@handle`), discover peers through real-time prefix search, and engage in direct or group chats backed by live WebSockets, read receipts, and presence indicators.

### Architectural Philosophy

```text
+---------------------------------------------------------------------------------+
|                                 MODULAR MONOLITH                                |
|                                                                                 |
|  [Auth & Security] ──► [Users & Profiles] ──► [Friendships & Blocks]            |
|         │                       │                        │                      |
|         ▼                       ▼                        ▼                      |
|  [Conversations]   ──►   [Messages & Files]   ──►  [Real-Time STOMP / Redis]    |
|         │                       │                        │                      |
|         ▼                       ▼                        ▼                      |
|  [Notifications]   ──►   [Moderation Reports] ──►  [Admin Dashboard & Audit]    |
+---------------------------------------------------------------------------------+
```

- **Single Deployable Unit**: Zero distributed tracing or inter-service HTTP network hop latency.
- **Strict Package-by-Feature Domain Isolation**: Each domain module contains its own entities, repositories, DTOs, service layer, and REST controllers. Cross-module calls occur via well-defined service interfaces.
- **Separation of Concerns**: High-frequency ephemeral data (user typing, active WebSocket presence) lives in Redis, while persistent relational records (users, messages, friendships, audit logs) reside in MySQL.

### High-Level Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                               │
│        React 18 SPA (Vite, TypeScript, Tailwind CSS, Lucide Icons)     │
└───────────────────────┬──────────────────────────▲─────────────────────┘
                        │ HTTP / REST              │ STOMP over WebSocket
                        │ (Axios + JWT)            │ (@stomp/stompjs)
┌───────────────────────▼──────────────────────────┴─────────────────────┐
│                          APPLICATION TIER                              │
│                    Spring Boot 3.3.4 (Java 21/25)                      │
│                                                                        │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │                      Security Layer                           │    │
│   │   Spring Security 6 Stateless Filter + JWT Provider           │    │
│   │   Channel Interceptor (WebSocket Handshake Authentication)     │    │
│   └───────────────────────────────┬───────────────────────────────┘    │
│                                   │                                    │
│   ┌───────────────────────────────▼───────────────────────────────┐    │
│   │                       Domain Modules                          │    │
│   │  auth  •  user  •  profile  •  friendship  •  block           │    │
│   │  conversation  •  message  •  realtime  •  file               │    │
│   │  notification  •  report  •  admin                            │    │
│   └──────────────────┬───────────────────────────┬────────────────┘    │
└──────────────────────┼───────────────────────────┼─────────────────────┘
                       │ JPA / Hibernate           │ Lettuce Redis Client
┌──────────────────────▼───────┐           ┌───────▼─────────────────────┐
│          DATA TIER           │           │        CACHE TIER           │
│        MySQL 8.0 RDBMS       │           │       Redis 7 In-Memory     │
│  - InnoDB Engine             │           │  - Ephemeral user presence  │
│  - utf8mb4 Collation         │           │  - Cluster-ready pub/sub    │
│  - B-Tree Indexes            │           │  - Resilient local fallback │
└──────────────────────────────┘           └─────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend** | Spring Boot | 3.3.4 | Framework for modular monolithic architecture |
| **Language** | Java (Oracle JDK) | 21 / 25 | Modern LTS platform runtime (No Lombok dependency) |
| **Security** | Spring Security + JJWT | 6.x / 0.12.6 | Stateless JWT authorization, BCrypt cost 12 |
| **Real-Time** | Spring WebSocket + STOMP | 3.3.4 | Full duplex pub-sub with SockJS fallback |
| **Database** | MySQL | 8.0 | Primary relational storage with InnoDB & utf8mb4 |
| **Cache & Presence**| Redis | 7.x Alpine | User online status, low latency presence queries |
| **Persistence** | Spring Data JPA / Hibernate | 6.5.x | ORM, query generation, and indexing |
| **File Storage** | Java NIO Local Storage | Custom | Safe path traversal sanitization, MIME verification |
| **API Docs** | Springdoc OpenAPI / Swagger | 2.6.0 | Interactive API documentation |
| **Frontend** | React + Vite | 18.3 / 5.4 | SPA frontend with blazing fast HMR |
| **Language** | TypeScript | 5.5 | End-to-end type safety |
| **Styling** | Tailwind CSS | 3.4 | Dark Cyber theme with glassmorphic elements |
| **Icons** | Lucide React | Latest | Clean, accessible UI icons |
| **Orchestration** | Docker & Docker Compose | Compose v2 | Multi-stage production container deployment |

---

## 3. Core System Features

### Identity & Security Model
- **UUID Primary Keys**: All system entities extend a common `BaseEntity` generating standard UUIDs, safeguarding against sequential ID enumeration attacks.
- **Stateless JWT Flow**: 15-minute expiration access tokens paired with 7-day refresh tokens.
- **BCrypt Password Hashing**: Passwords salt-hashed with a high computational cost factor of 12.
- **Role-Based Access Control (RBAC)**: `USER`, `ADMIN`, `SUPER_ADMIN` with hierarchical role permissions.

### User Profiles & Case-Insensitive Search
- **Unique `@handle`**: Lowercase normalized indexed column (`username_lower`) enforces global case-insensitive uniqueness while preserving user-defined casing.
- **Prefix Autocomplete**: B-Tree indexed search optimized for keystroke queries (`GET /api/users/search?q=avi`) with 300ms client debouncing and instant `Ctrl+K` keyboard shortcut modal.
- **Privacy Controls**: Users can toggle message privacy between `EVERYONE` and `FRIENDS_ONLY`.

### Friend System & Canonical Uniqueness
- **Canonical Pairing**: Direct friendships are stored once using canonical ordering (`user1_id < user2_id`). This eliminates duplicate inverse rows and simplifies friendship verification to an `O(1)` indexed lookup.
- **Lifecycle Workflow**: Full status tracking (`PENDING` -> `ACCEPTED` / `REJECTED` / `CANCELLED`).
- **Comprehensive UI**: 4-tab management screen for Accepted Friends, Incoming Requests, Sent Requests, and Blocked Users.

### Unidirectional Block Enforcement
- **Instant Severance**: Blocking another user automatically destroys any existing friendship and cancels pending friend requests.
- **Strict Isolation**: Blocked users cannot view the blocker's profile, cannot send friend requests, cannot initiate conversations, and cannot see online status.

### Direct & Group Conversations
- **Guaranteed Single Direct Room**: Database constraints ensure exactly one direct conversation exists between any two users.
- **Group Chats**: Group channels support custom titles, avatars, descriptions, and dynamic membership with roles (`ADMIN`, `MEMBER`).

### Messaging Engine & Cursor Pagination
- **Multi-Type Messaging**: Supports `TEXT`, `IMAGE`, `VIDEO`, `FILE`, `VOICE`, and `SYSTEM` message types.
- **Zero-Drift Cursor Pagination**: Messages are queried using composite indexes on `(conversation_id, created_at DESC, id DESC)`, avoiding traditional `LIMIT / OFFSET` pagination performance decay and skipping errors during live updates.
- **Message Lifecycle**:
  - **Soft-Delete**: Content replaced with `"This message was deleted"` while preserving thread context.
  - **In-Place Edits**: Content can be revised by the sender with a clear `(edited)` timestamp flag.
  - **Multi-User Emoji Reactions**: Toggle reactions (`👍`, `❤️`, `😂`, `🔥`, `🎉`, `😮`) aggregated per message.
  - **Read Receipts**: Tracks per-member read checkpoints with unread counter badges.

### Real-Time WebSocket & STOMP Protocol
- **STOMP Authenticator**: Intercepts STOMP `CONNECT` frames to validate Bearer JWT tokens before establishing sessions.
- **Live Typing Relay**: Broadcasts typing states (`/app/conversations/{id}/typing`) with automatic client debouncing and auto-clearing animated typing bubbles.
- **Presence Engine**: Redis-backed presence tracking with in-memory fallback.

### File Storage & Media Attachments
- **Sanitized Upload Engine**: Local storage provider with strict path traversal protections, filename UUID prefixing, MIME type verification, and a 10MB size limit.
- **Inline Rendering**: Instant thumbnail previews before sending, inline image viewer, audio player, and document downloaders.

### Notifications & Moderation System
- **In-App Notifications**: Real-time notifications for incoming friend requests, accepted friendships, and mentions with unread counter badge.
- **Content Reporting**: Users can report abusive users, offensive messages, or rogue conversations with classified reasons (`SPAM`, `HARASSMENT`, `INAPPROPRIATE_CONTENT`, `OTHER`).

### Admin Dashboard & Audit Logging
- **Protected Portal**: Accessible only by users with `ROLE_ADMIN` or `ROLE_SUPER_ADMIN` at `/admin`.
- **System Metrics**: Live aggregated cards for Total Users, Active Users, Suspended Users, Total Messages, Conversations, and Pending Reports.
- **User Moderation**: Suspend, Ban, Activate users, and toggle Admin privileges (with protection forbidding self-action and non-super-admin modification of super-admins).
- **Moderation Queue**: Resolve or dismiss abuse reports with mandatory admin resolution audit notes.
- **Audit Logs**: Immutable log stream capturing every administrative action, target metadata, timestamp, and client IP address.

---

## 4. Database Design & Schema Highlights

```text
       ┌───────────────┐                 ┌───────────────────────┐
       │     users     │1               *│     friend_requests   │
       │───────────────│─────────────────│───────────────────────│
       │ id (UUID, PK) │                 │ id (UUID, PK)         │
       │ username      │                 │ sender_id (FK)        │
       │ username_lower│                 │ receiver_id (FK)      │
       │ email         │                 │ status (PENDING...)   │
       │ password_hash │                 └───────────────────────┘
       │ role          │
       │ account_status│                 ┌───────────────────────┐
       │ privacy       │1               *│       blocks          │
       └───────┬───────┘─────────────────│───────────────────────│
               │                         │ blocker_id (FK)       │
               │1                        │ blocked_id (FK)       │
               │                         └───────────────────────┘
               │1
       ┌───────▼───────┐                 ┌───────────────────────┐
       │   profiles    │1               *│      friendships      │
       │───────────────│─────────────────│───────────────────────│
       │ user_id (PK)  │                 │ user1_id (FK, smaller)│
       │ display_name  │                 │ user2_id (FK, larger) │
       │ bio           │                 └───────────────────────┘
       │ avatar_url    │
       └───────────────┘
               │1
               │
               │*                        ┌───────────────────────┐
       ┌───────▼───────────────┐        *│  conversation_members │
       │     conversations     │─────────│───────────────────────│
       │───────────────────────│1        │ conversation_id (FK)  │
       │ id (UUID, PK)         │         │ user_id (FK)          │
       │ type (DIRECT / GROUP) │         │ role (ADMIN / MEMBER) │
       │ direct_pair_key       │         └───────────────────────┘
       └───────┬───────────────┘
               │1
               │*
       ┌───────▼───────────────┐         ┌───────────────────────┐
       │       messages        │1       *│  message_attachments  │
       │───────────────────────│─────────│───────────────────────│
       │ id (UUID, PK)         │         │ id (UUID, PK)         │
       │ conversation_id (FK)  │         │ message_id (FK)       │
       │ sender_id (FK)        │         │ file_url, size, mime  │
       │ content               │         └───────────────────────┘
       │ type (TEXT, IMAGE...) │
       │ is_deleted, is_edited │         ┌───────────────────────┐
       │ reply_to_id (FK)      │1       *│   message_reactions   │
       └───────────────────────┘─────────│───────────────────────│
                                         │ message_id (FK)       │
                                         │ user_id (FK)          │
                                         │ emoji                 │
                                         └───────────────────────┘
```

### Key Indexing Strategies
- `idx_users_username_lower`: `UNIQUE (username_lower)` — case-insensitive index for lightning-fast logins and prefix searches.
- `idx_friendships_canonical`: `UNIQUE (user1_id, user2_id)` where `user1_id < user2_id` is enforced in business logic.
- `idx_direct_pair_key`: `UNIQUE (direct_pair_key)` on conversations ensures direct chat uniqueness.
- `idx_messages_cursor`: `INDEX (conversation_id, created_at DESC, id DESC)` — optimizes cursor pagination without table scans.
- `idx_reports_status_created`: `INDEX (status, created_at DESC)` — optimizes admin queue filtering.
- `idx_audit_logs_created_at`: `INDEX (created_at DESC)` — chronologically orders admin action feeds.

---

## 5. Real-Time STOMP Protocol Reference

WebSocket Endpoint: `/ws` (Native WebSocket + SockJS Fallback)

### Authentication
Include the Bearer JWT token in the STOMP `CONNECT` header:
```text
CONNECT
accept-version:1.1,1.2
Authorization:Bearer <YOUR_JWT_ACCESS_TOKEN>
heart-beat:10000,10000
```

### Channels & Subscriptions

| Destination | Purpose | Direction |
| :--- | :--- | :--- |
| `/topic/conversations/{id}` | New messages, edits, deletions, reactions | Broker -> Client |
| `/topic/presence` | Global presence updates (`ONLINE` / `OFFLINE`) | Broker -> Client |
| `/user/queue/notifications` | Private user notifications & friend request alerts | Broker -> Client |
| `/app/conversations/{id}/typing` | Send typing indicator notification | Client -> Broker |
| `/topic/conversations/{id}/typing` | Receive typing indicator broadcast | Broker -> Client |

---

## 6. REST API Reference

All successful responses return HTTP 200/201 wrapped in the standard envelope:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-09-25T14:30:00Z"
}
```

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create account (`username`, `email`, `password`, `displayName`).
- `POST /api/auth/login` — Authenticate and receive `accessToken` + `refreshToken`.
- `POST /api/auth/refresh` — Refresh expired access token using refresh token.

### Profiles & Users (`/api/profiles`, `/api/users`)
- `GET /api/profiles/me` — Get current user profile.
- `PUT /api/profiles/me` — Update display name, bio, and avatar.
- `GET /api/profiles/by-username/{username}` — Get public profile by `@handle`.
- `GET /api/users/search?q={prefix}` — Case-insensitive prefix search.
- `PUT /api/users/me/privacy` — Update message privacy (`EVERYONE` | `FRIENDS_ONLY`).

### Friendships & Blocks (`/api/friends`, `/api/blocks`)
- `POST /api/friends/requests/{userId}` — Send friend request.
- `PUT /api/friends/requests/{requestId}/accept` — Accept friend request.
- `PUT /api/friends/requests/{requestId}/reject` — Reject friend request.
- `DELETE /api/friends/requests/{requestId}` — Cancel sent request.
- `GET /api/friends` — List accepted friends.
- `GET /api/friends/requests/incoming` — List incoming pending requests.
- `GET /api/friends/requests/outgoing` — List sent pending requests.
- `DELETE /api/friends/{friendUserId}` — Remove friendship.
- `POST /api/blocks/{userId}` — Block a user (severs friendship).
- `DELETE /api/blocks/{userId}` — Unblock a user.
- `GET /api/blocks` — List blocked users.

### Conversations & Messages (`/api/conversations`, `/api/messages`)
- `GET /api/conversations` — List conversations sorted by recent activity.
- `POST /api/conversations/direct/{userId}` — Get or create direct conversation.
- `POST /api/conversations/group` — Create new group chat.
- `POST /api/conversations/{id}/members` — Add members to group.
- `GET /api/messages/conversation/{conversationId}` — Cursor-paginated message history.
- `POST /api/messages` — Send message with optional attachments or reply ID.
- `PUT /api/messages/{messageId}` — Edit message content.
- `DELETE /api/messages/{messageId}` — Soft-delete message.
- `POST /api/messages/{messageId}/reactions` — Toggle emoji reaction.
- `PUT /api/messages/conversation/{id}/read` — Mark conversation messages as read.

### File Storage (`/api/files`)
- `POST /api/files/upload` — Upload media (up to 10MB).
- `GET /api/files/{fileName}` — Public download/streaming endpoint.

### Notifications & Reports (`/api/notifications`, `/api/reports`)
- `GET /api/notifications` — List recent in-app notifications.
- `GET /api/notifications/unread-count` — Count of unread notifications.
- `PUT /api/notifications/{id}/read` — Mark notification as read.
- `PUT /api/notifications/read-all` — Mark all as read.
- `POST /api/reports` — Submit moderation report against user, message, or chat.

### Admin Moderation Portal (`/api/admin`) *(Requires `ROLE_ADMIN` / `ROLE_SUPER_ADMIN`)*
- `GET /api/admin/stats` — Overall platform analytics overview.
- `GET /api/admin/users` — Paginated user search with status and role filters.
- `PUT /api/admin/users/{id}/status` — Set account status (`ACTIVE`, `SUSPENDED`, `BANNED`).
- `PUT /api/admin/users/{id}/role` — Set user role (`USER`, `ADMIN`, `SUPER_ADMIN`).
- `GET /api/admin/reports` — Moderation reports queue with status filter.
- `PUT /api/admin/reports/{id}/resolve` — Resolve or dismiss report with resolution notes.
- `GET /api/admin/audit-logs` — Paginated chronological audit log trail.

---

## 7. Getting Started & Installation

ChatX supports flexible development workflows depending on your preference and environment:

| Mode | Best For | Prerequisites | Command to Launch |
| :--- | :--- | :--- | :--- |
| **Mode 1: One-Command Docker Full Stack** | Quick test, full production parity | Docker & Docker Compose | `docker compose up --build -d` |
| **Mode 2A: Standalone Backend (MySQL + Redis)** | Full backend development | Java 21+, Maven 3.9+, MySQL, Redis | `cd chatx-backend && mvn spring-boot:run` |
| **Mode 2B: Standalone Backend (Zero-Infra H2)** | Instant backend test with zero setup | Java 21+, Maven 3.9+ | `mvn spring-boot:run -Dspring-boot.run.profiles=local` |
| **Mode 3: Standalone Frontend** | UI & React styling development | Node.js 18+, npm 9+ | `cd chatx-frontend && npm run dev` |
| **Mode 4: Combined Side-by-Side Local Dev** | Active full-stack feature development | Java 21+, Maven, Node 18+, Docker | Run DB via Docker, run backend & frontend in terminals |

---

### Prerequisites & System Matrix

Ensure you have the following installed according to your preferred development mode:

| Tool / Runtime | Required Version | Verification Command | Notes |
| :--- | :--- | :--- | :--- |
| **Java JDK** | 21 LTS or 25 LTS | `java -version` | Oracle JDK or Eclipse Temurin recommended |
| **Apache Maven** | 3.9.0+ | `mvn -version` | Build tool for the Spring Boot backend |
| **Node.js & npm** | Node 18+ (20+ LTS recommended), npm 9+ | `node -v` && `npm -v` | JavaScript runtime for Vite & React |
| **Docker Desktop** | Compose v2.20+ | `docker compose version` | Required for containerized mode or local Redis/MySQL |
| **MySQL** *(Optional if using Docker/H2)* | 8.0+ | `mysql --version` | Default local port `3306` |
| **Redis** *(Optional if using Docker/H2)* | 7.0+ | `redis-cli --version` | Default local port `6379` |

---

### Mode 1: One-Command Full Stack (Docker Compose)

This runs all 4 application tiers in isolated Docker containers with automated health checks and dependencies:
1. `chatx-mysql` (MySQL 8.0 database)
2. `chatx-redis` (Redis 7 in-memory cache & presence)
3. `chatx-backend` (Spring Boot 3 REST & STOMP server)
4. `chatx-frontend` (Nginx serving compiled React SPA and proxying traffic)

#### Step 1: Clone and Enter the Directory
```bash
git clone https://github.com/your-username/ChatX.git
cd ChatX
```

#### Step 2: (Optional) Configure Environment Variables
Copy `.env.example` to `.env` to override defaults (a safe default secret is preconfigured):
```bash
# On Linux / macOS
cp .env.example .env

# On Windows PowerShell
Copy-Item .env.example .env
```

#### Step 3: Build and Start All Services
```bash
docker compose up --build -d
```

#### Step 4: Verify Container Health
```bash
docker compose ps
```
*All 4 services (`chatx-mysql`, `chatx-redis`, `chatx-backend`, `chatx-frontend`) should show status `Up` or `healthy`.*

#### Service URLs in Docker Mode:
- **ChatX Web App**: [http://localhost](http://localhost) (Port 80)
- **Backend API**: [http://localhost:8080/api](http://localhost:8080/api)
- **Interactive Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **MySQL RDBMS**: `localhost:3306`
- **Redis Cache**: `localhost:6379`

#### Useful Docker Management Commands:
```bash
# Stream backend logs
docker compose logs -f backend

# Stream frontend / Nginx proxy logs
docker compose logs -f frontend

# Stop all containers (preserves database volume data)
docker compose stop

# Destroy containers and clean up
docker compose down

# Destroy containers and delete persistent database & Redis volumes
docker compose down -v
```

---

### Mode 2: Backend Standalone Installation & Running

The backend is built with Spring Boot 3.3.4 and Java 21. It resides in the [`chatx-backend/`](file:///d:/ChatX/chatx-backend) directory.

#### Step 2.1: Navigate to the Backend Directory
```bash
cd ChatX/chatx-backend
```

#### Step 2.2: Choose Your Database Strategy

##### Option 2A: Standalone with MySQL 8.0 & Redis 7.0 (Recommended for Full Parity)
1. **Quick-start MySQL & Redis using Docker**:
   If you have Docker installed, you don't need to manually configure MySQL and Redis on your machine:
   ```bash
   # From the project root (ChatX/)
   docker compose up mysql redis -d
   ```
2. **Or using native MySQL & Redis**:
   If running native MySQL 8, log into your MySQL client and initialize the database and user:
   ```sql
   CREATE DATABASE chatx_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   CREATE USER 'chatx_user'@'%' IDENTIFIED BY 'chatx_pass';
   GRANT ALL PRIVILEGES ON chatx_db.* TO 'chatx_user'@'%';
   FLUSH PRIVILEGES;
   ```
   Start your local Redis service on default port `6379`.

##### Option 2B: Zero-Dependency Rapid Dev (Embedded H2 Database)
If you want to run the backend immediately **without installing MySQL, Docker, or Redis**:
- ChatX includes a dedicated `local` profile.
- It uses a persistent file-based H2 database (`./data/chatx_db`) configured in MySQL compatibility mode.
- Redis health checks are safely disabled.

#### Step 2.3: Build & Test Backend
```bash
# Compile and download dependencies
mvn clean compile

# Execute test suite (43 unit & integration tests)
mvn test
```

#### Step 2.4: Run the Backend Application

- **To run with MySQL + Redis (dev profile)**:
  ```bash
  # Runs on port 8088 by default
  mvn spring-boot:run
  # Or explicitly:
  mvn spring-boot:run -Dspring-boot.run.profiles=dev
  ```

- **To run with Embedded H2 (local profile, zero dependencies)**:
  ```bash
  mvn spring-boot:run -Dspring-boot.run.profiles=local
  ```

#### Step 2.5: Backend Verification
Once started, you will see Spring Boot startup logs ending with `Started ChatXApplication in X seconds`.
- **Backend API Base**: `http://localhost:8088/api`
- **Swagger UI Interactive Docs**: [http://localhost:8088/swagger-ui.html](http://localhost:8088/swagger-ui.html)
- **H2 Console** *(if running local profile)*: [http://localhost:8088/h2-console](http://localhost:8088/h2-console) (JDBC URL: `jdbc:h2:file:./data/chatx_db`, User: `sa`, Password: empty)

---

### Mode 3: Frontend Standalone Installation & Running

The frontend is a modern React 18 single-page application built with Vite, TypeScript, and Tailwind CSS. It resides in the [`chatx-frontend/`](file:///d:/ChatX/chatx-frontend) directory.

#### Step 3.1: Navigate to the Frontend Directory
```bash
cd ChatX/chatx-frontend
```

#### Step 3.2: Install Dependencies
```bash
npm install
```

#### Step 3.3: Understand the Vite Proxy Architecture
In local development, the Vite development server runs on `http://localhost:5173`.
To prevent Cross-Origin Resource Sharing (CORS) hurdles and simplify WebSocket handling, Vite is preconfigured in `vite.config.ts` to automatically reverse proxy:
- All `/api/*` REST HTTP requests ──► `http://localhost:8088/api/*`
- All `/ws` STOMP WebSocket traffic ──► `http://localhost:8088/ws`

*Note: If your backend is running on a custom port other than 8088 (e.g. 8080), simply update the target in `chatx-frontend/vite.config.ts`.*

#### Step 3.4: Launch the Frontend Development Server
```bash
npm run dev
```

The terminal will display:
```text
  VITE v5.4.7  ready in 240 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

#### Step 3.5: Access the Web Application
Open [http://localhost:5173](http://localhost:5173) in your browser.

#### Additional Frontend Scripts:
```bash
# Typecheck with TypeScript and compile production bundle into dist/
npm run build

# Preview the compiled production build locally
npm run preview

# Run ESLint validation
npm run lint
```

---

### Mode 4: Combined Local Development (Side-by-Side)

For active full-stack software development, running the frontend and backend in separate terminals allows you to leverage **Hot Module Replacement (HMR)** in React and **Spring Boot DevTools / fast recompilation** in Java simultaneously.

#### Terminal 1: Infrastructure (Databases)
```bash
cd ChatX
docker compose up mysql redis -d
```
*(Skip Terminal 1 if you use the H2 `local` backend profile).*

#### Terminal 2: Backend (Spring Boot)
```bash
cd ChatX/chatx-backend
mvn spring-boot:run
```
*Backend listens on `http://localhost:8088`.*

#### Terminal 3: Frontend (Vite React SPA)
```bash
cd ChatX/chatx-frontend
npm run dev
```
*Frontend listens on `http://localhost:5173` and proxies requests to backend.*

---

### Default Seeded Credentials & Verification

On startup, ChatX automatically initializes a default Super Administrator account via [`DataInitializer`](file:///d:/ChatX/chatx-backend/src/main/java/com/chatx/common/config/DataInitializer.java):

| Property | Value |
| :--- | :--- |
| **Username** | `admin` |
| **Email** | `admin@chatx.com` |
| **Password** | `Admin@1234` |
| **Role** | `SUPER_ADMIN` |
| **Admin Portal** | [http://localhost:5173/admin](http://localhost:5173/admin) *(or `http://localhost/admin` in Docker)* |

#### Verifying End-to-End Real-Time Messaging:
1. Open [http://localhost:5173](http://localhost:5173) in your primary browser. Log in with `admin` / `Admin@1234`.
2. Open an **Incognito / Private Window** (or a second browser).
3. Navigate to [http://localhost:5173/register](http://localhost:5173/register) and create a second account (e.g., username: `alice`, password: `Password@123`).
4. In Alice's window, press `Ctrl+K` (or click search), search for `@admin`, and send a friend request.
5. In Admin's window, observe the live in-app notification badge increment via STOMP WebSocket. Navigate to Friends -> Incoming Requests and click **Accept**.
6. Switch back to Alice or Admin, click **Chat**, and start exchanging live messages, typing indicators, reactions, and file attachments!

---

### Development Port & Communication Map

| Port | Service | Environment | Access / Role |
| :--- | :--- | :--- | :--- |
| `80` | Nginx Frontend Proxy | Docker Compose | Public Web Entrypoint (Proxies to SPA, `/api`, `/ws`) |
| `5173` | Vite Dev Server | Local Dev | React SPA with Live HMR |
| `8080` | Spring Boot API | Docker Container | REST endpoints & STOMP WebSocket in Docker |
| `8088` | Spring Boot API | Local Dev (dev / local profile) | REST endpoints & STOMP WebSocket during local dev |
| `3306` | MySQL 8.0 Server | Docker / Native | Relational database (InnoDB, utf8mb4) |
| `6379` | Redis 7.0 Server | Docker / Native | User online presence & volatile pub/sub |

---

### Troubleshooting & Common Issues

#### 1. Port Already in Use (e.g. 8088, 8080, 5173, 3306)
- **Symptom**: `Web server failed to start. Port 8088 was already in use.`
- **Solution (Windows PowerShell)**:
  ```powershell
  # Find PID occupying the port
  netstat -ano | findstr :8088
  # Terminate the process (replace <PID> with the number from rightmost column)
  taskkill /PID <PID> /F
  ```
- **Solution (Linux / macOS)**:
  ```bash
  lsof -ti :8088 | xargs kill -9
  ```

#### 2. MySQL Connection Refused / Access Denied
- **Symptom**: `Communications link failure` or `Access denied for user 'chatx_user'@'localhost'`.
- **Solution**:
  - Verify container status: `docker compose ps mysql`.
  - Ensure the credentials in `.env` or `application-dev.yml` match (`chatx_user` / `chatx_pass`).
  - Alternatively, switch immediately to the zero-dependency H2 profile: `mvn spring-boot:run -Dspring-boot.run.profiles=local`.

#### 3. Redis Connection Refused
- **Symptom**: `Unable to connect to Redis; nested exception is io.lettuce.core.RedisConnectionException`.
- **Solution**:
  - Start Redis via Docker: `docker compose up redis -d`.
  - Or run the backend with `-Dspring-boot.run.profiles=local` which disables Redis health checks and relies on resilient in-memory presence fallbacks.

#### 4. STOMP WebSocket Fails to Connect
- **Symptom**: Console error `WebSocket connection to 'ws://localhost:5173/ws' failed`.
- **Solution**:
  - Verify that the Spring Boot backend is actively running on `http://localhost:8088`.
  - Check `chatx-frontend/vite.config.ts` to ensure the proxy target matches your running backend port.
  - Verify your JWT token hasn't expired (log out and log in again).

#### 5. File Upload Size Exceeded
- **Symptom**: HTTP 413 or `Maximum upload size exceeded`.
- **Solution**:
  - ChatX configures a default file size limit of 10MB (`spring.servlet.multipart.max-file-size=10MB`).
  - To increase this limit, update `application.yml` and `nginx.conf` (`client_max_body_size`).

---

## 8. Environment Variables Reference

Copy `.env.example` to `.env` to customize settings:

```dotenv
# Database Configuration
CHATX_DB_HOST=localhost
CHATX_DB_PORT=3306
CHATX_DB_NAME=chatx_db
CHATX_DB_USERNAME=chatx_user
CHATX_DB_PASSWORD=chatx_pass

# Redis Configuration
CHATX_REDIS_HOST=localhost
CHATX_REDIS_PORT=6379

# Security & Tokens
CHATX_JWT_SECRET=9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b

# Server & CORS
CHATX_SERVER_PORT=8080
CHATX_CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost

# File Storage
CHATX_UPLOAD_DIR=./uploads
```

---

## 9. Testing & Quality Assurance

ChatX includes unit and integration tests covering every single domain service, security check, and data access boundary.

### Run Backend Tests:
```bash
cd chatx-backend
mvn test
```

**Results: 43 Tests Run, 0 Failures, 0 Errors, 0 Skipped.**
- `AdminServiceTest`: 7 tests passed (Metrics calculation, status modification, self-action denial, super-admin hierarchy protection, audit logging).
- `ReportServiceTest`: 2 tests passed (Report filing, status resolution).
- `MessageServiceTest`: 5 tests passed (Message persistence, soft delete, editing, reactions, permissions).
- `FriendshipServiceTest`: 5 tests passed (Request dispatch, acceptance, rejection, removal).
- `BlockServiceTest`: 3 tests passed (Blocking, unblocking, friendship severance).
- `ConversationServiceTest`: 5 tests passed (Direct creation, group creation, member management).
- `FileStorageServiceTest`: 3 tests passed (Directory initialization, upload verification, MIME validation).
- `AuthServiceTest`: 6 tests passed (Registration, login, bad credentials, duplicate handle protection).
- `ProfileServiceTest`: 3 tests passed (Profile retrieval, update validation).
- `UserServiceTest`: 3 tests passed (Prefix search, privacy toggle).
- `ChatXApplicationTests`: 1 test passed (Context bootstrap).

### Run Frontend Production Build & TypeScript Verification:
```bash
cd chatx-frontend
npm run build
```
*Output: `tsc && vite build` transforms 1,958 modules with zero errors in ~4.8s.*

---

## 10. Production Deployment Guidelines

### 1. Reverse Proxy & SSL (Nginx / Certbot)
For standard VPS deployments (Ubuntu / Debian), put Nginx with Let's Encrypt SSL in front of the application:
```nginx
server {
    listen 443 ssl http2;
    server_name chatx.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/chatx.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chatx.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:80; # Frontend container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### 2. Container Memory & JVM Optimization
The backend `Dockerfile` is tuned for containerized Linux environments with:
- `-XX:+UseG1GC` — Garbage-First GC for low latency pause times during high concurrent message throughput.
- `-XX:MaxRAMPercentage=75.0` — Dynamically scales JVM heap consumption according to host memory limits.

---

## 11. Repository Structure

```text
ChatX/
├── .env.example                 # Environment variables template
├── docker-compose.yml           # Production & multi-container orchestration
├── README.md                    # Root project documentation & complete developer manual
│
├── chatx-backend/               # Spring Boot 3.3.4 Application (Java 21)
│   ├── README.md                # Standalone backend documentation & guide
│   ├── Dockerfile               # Multi-stage Eclipse Temurin JDK 21 build
│   ├── pom.xml                  # Maven project dependencies & build configuration
│   └── src/
│       ├── main/
│       │   ├── java/com/chatx/
│       │   │   ├── admin/       # Platform analytics, user moderation, audit logging
│       │   │   ├── auth/        # JWT stateless token provider, filters, security config
│       │   │   ├── block/       # Unidirectional user block logic & friendship severance
│       │   │   ├── common/      # Global exceptions, ApiResponse, BaseEntity, DataInitializer
│       │   │   ├── conversation/# Direct & group chat rooms, participant management
│       │   │   ├── file/        # Sanitized file upload & media streaming service
│       │   │   ├── friendship/  # Canonical friend requests & friend pair relationships
│       │   │   ├── message/     # Message engine, cursor pagination, reactions, edits
│       │   │   ├── notification/# In-app alerts & real-time badge dispatch
│       │   │   ├── realtime/    # STOMP WebSocket broker & Redis presence tracking
│       │   │   ├── report/      # User & content abuse moderation reporting
│       │   │   ├── user/        # User accounts, BCrypt passwords, prefix search
│       │   │   └── ChatXApplication.java  # Main Spring Boot bootstrap class
│       │   └── resources/
│       │       ├── application.yml        # Base configuration & custom ChatX tokens
│       │       ├── application-dev.yml    # Development profile (MySQL 8 + Redis)
│       │       ├── application-local.yml  # Zero-dependency local profile (Embedded H2)
│       │       └── application-prod.yml   # Production container profile
│       └── test/                # Comprehensive unit & integration test suite (43 tests)
│
└── chatx-frontend/              # React 18 SPA (Vite + TypeScript + Tailwind CSS)
    ├── README.md                # Standalone frontend documentation & guide
    ├── Dockerfile               # Multi-stage Node builder + Nginx static server
    ├── nginx.conf               # Nginx reverse proxy configuration for Docker
    ├── package.json             # NPM dependencies & scripts
    ├── tailwind.config.js       # Cyber dark mode theme & custom color tokens
    ├── tsconfig.json            # Strict TypeScript configuration
    ├── vite.config.ts           # Vite build config & proxy to http://localhost:8088
    └── src/
        ├── components/          # Reusable UI widgets (Modals, Badges, Loaders, Layouts)
        ├── context/             # AuthContext (JWT session, login, logout, refresh)
        ├── features/            # Feature-driven modular architecture
        │   ├── admin/           # Metrics, user suspension, audit log table, report queue
        │   ├── auth/            # Login, Registration, JWT persistence
        │   ├── chat/            # Live chat room, cursor scroll, typing indicators, attachments
        │   ├── friends/         # 4-tab friend management & request handling
        │   ├── profile/         # User profile views & self-profile editor
        │   └── users/           # User search modal (Ctrl+K) & public profiles
        ├── services/            # Axios HTTP client & STOMP WebSocket client wrappers
        ├── types/               # TypeScript data models and DTO interfaces
        └── utils/               # Time formatters, file size helpers, constants
```

---

## 📄 License

This project is licensed under the **MIT License**. See `LICENSE` for details.

Developed with precision and clean architecture.

