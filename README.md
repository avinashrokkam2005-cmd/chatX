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
- [7. Getting Started](#7-getting-started)
  - [Prerequisites](#prerequisites)
  - [Option A: One-Command Full Stack (Docker Compose)](#option-a-one-command-full-stack-docker-compose)
  - [Option B: Local Development](#option-b-local-development)
- [8. Environment Variables Reference](#8-environment-variables-reference)
- [9. Testing & Quality Assurance](#9-testing--quality-assurance)
- [10. Production Deployment Guidelines](#10-production-deployment-guidelines)

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

## 7. Getting Started

### Prerequisites
- **Docker & Docker Compose** (Recommended)
- *Or for manual setup*:
  - Java JDK 21 or 25
  - Apache Maven 3.9+
  - Node.js 18+ and npm
  - Local MySQL 8.0 and Redis 7.0 instances

---

### Option A: One-Command Full Stack (Docker Compose)

The easiest way to run the entire production-style environment:

```bash
# 1. Clone repository
git clone https://github.com/your-username/ChatX.git
cd ChatX

# 2. Build and run all containers (MySQL, Redis, Backend, Frontend)
docker compose up --build -d
```

#### Access Points:
- **ChatX Web Application**: [http://localhost](http://localhost) (Port 80)
- **Backend API**: [http://localhost:8080/api](http://localhost:8080/api)
- **Swagger UI API Explorer**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

To view logs:
```bash
docker compose logs -f backend
```

To shut down:
```bash
docker compose down
```

---

### Option B: Local Development

#### 1. Start MySQL & Redis Containers Only
```bash
docker compose up mysql redis -d
```

#### 2. Run Spring Boot Backend
```bash
cd chatx-backend

# Verify all unit tests pass
mvn test

# Start the application with dev profile
mvn spring-boot:run
```
*The backend server will start on `http://localhost:8080`.*

#### 3. Run React Frontend
```bash
cd ../chatx-frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*The frontend application will start on `http://localhost:5173`.*

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

## 📄 License

This project is licensed under the **MIT License**. See `LICENSE` for details.

Developed with precision and clean architecture.
