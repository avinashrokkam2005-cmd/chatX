# ChatX — Production-Style Real-Time Messaging Platform

A modular monolithic real-time social communication and messaging platform engineered with **Spring Boot 3 (Java 21/25)**, **MySQL 8**, **Redis 7**, and **React 18 (TypeScript + Vite + Tailwind CSS)**.

---

## 🌟 Architectural Highlights

- **Modular Monolith**: Strict domain separation (`auth`, `user`, `profile`, `friendship`, `block`, `conversation`, `message`, `realtime`, `file`, `notification`, `report`, `admin`) within a single deployable application. No distributed network latency or microservice complexity overhead.
- **Enterprise Security**: Spring Security 6 stateless JWT architecture (access tokens + refresh tokens), BCrypt password hashing (cost factor 12), and role-based access control (`USER`, `ADMIN`, `SUPER_ADMIN`).
- **Real-Time WebSocket & STOMP**:
  - Full-duplex messaging with SockJS fallback (`/ws`).
  - STOMP authentication channel interceptor with JWT validation on connect.
  - Granular conversation subscriptions (`/topic/conversations/{id}`).
  - Typing indicator relays with automatic debounce (`/app/conversations/{id}/typing`).
  - Cluster-ready Redis presence tracking with resilient in-memory fallback.
- **Advanced Social & Conversation Modeling**:
  - Direct 1-on-1 chats with canonical user pair uniqueness constraint (`user1_id < user2_id`).
  - Group chats with membership management, roles (`ADMIN`, `MEMBER`), and metadata.
  - Friend request lifecycle (`PENDING` -> `ACCEPTED` / `REJECTED` / `CANCELLED`).
  - Privacy controls: Toggle message privacy (`EVERYONE` vs `FRIENDS_ONLY`).
  - Unidirectional blocking: Blocks immediately sever friendships, hide profiles, and restrict message delivery.
- **High-Performance Messaging**:
  - Cursor-based pagination indexed on `(conversation_id, created_at DESC, id DESC)` for zero offset drift.
  - Soft-delete semantics: message content masked with `"This message was deleted"` while preserving thread integrity.
  - Message editing with historical edit flags.
  - Multi-user emoji reactions.
  - Read receipts and unread badges tracking.
- **Local File Storage Engine**:
  - Multi-type media attachments (`IMAGE`, `VIDEO`, `AUDIO`, `FILE`).
  - Secure path traversal sanitization, MIME-type verification, and size validation (10MB limit).
- **Admin Moderation & Governance**:
  - Moderation queue for user, message, and conversation abuse reports.
  - User state management (`ACTIVE`, `SUSPENDED`, `BANNED`).
  - Role management with Super-Admin hierarchy protection.
  - Immutable audit logging of all administrative actions.

---

## 🏗️ System Architecture

```text
+--------------------------------------------------------------------------+
|                               CHATX CLIENT                               |
|                  React 18 + TypeScript + Vite + Tailwind                 |
+------------------------------------+-------------------------------------+
                                     |
                       REST API / HTTP   WebSocket / STOMP
                                     |
+------------------------------------v-------------------------------------+
|                              SPRING BOOT 3                               |
|                     Modular Monolith Architecture                        |
|                                                                          |
|  [Security & Auth]  [Profiles & Search]  [Friendships & Blocks]          |
|  [Conversations]    [Messaging Engine]   [File Storage]                  |
|  [Notifications]    [Moderation Reports] [Admin Dashboard & Audit]       |
+-------------------+----------------------------------+-------------------+
                    |                                  |
            JPA / Hibernate                     Lettuce Client
                    |                                  |
+-------------------v--------------+   +---------------v-------------------+
|             MYSQL 8              |   |              REDIS 7              |
|  - Users, Profiles, Friends      |   |  - Presence (Online / Offline)    |
|  - Conversations & Members       |   |  - Real-Time Ephemeral Sessions   |
|  - Messages & Reactions          |   +-----------------------------------+
|  - Reports & Audit Logs          |
+----------------------------------+
```

---

## 📂 Project Structure

```text
ChatX/
├── docker-compose.yml              # Production full-stack container orchestration
├── .env.example                    # Environment configuration template
├── chatx-backend/                  # Spring Boot 3 modular monolithic application
│   ├── src/main/java/com/chatx/
│   │   ├── common/                 # BaseEntity, GlobalExceptionHandler, PagedResponse, DTOs
│   │   ├── security/               # Spring Security 6, JWT Filter, UserPrincipal
│   │   ├── auth/                   # Registration, Login, Token Refresh
│   │   ├── user/                   # User entity, privacy controls, prefix search
│   │   ├── profile/                # Profile management & public views
│   │   ├── friendship/             # Canonical friendship & friend request workflow
│   │   ├── block/                  # Unidirectional blocking system
│   │   ├── conversation/           # Direct & Group chat rooms and members
│   │   ├── message/                # Messages, cursor pagination, reactions, edit/delete
│   │   ├── realtime/               # WebSocket STOMP config, Interceptors, PresenceService
│   │   ├── file/                   # File storage, uploads, and media streaming
│   │   ├── notification/           # Real-time notifications and read tracking
│   │   ├── report/                 # Abuse and moderation reporting system
│   │   └── admin/                  # Admin dashboard, user status, and audit logs
│   └── pom.xml
└── chatx-frontend/                 # React 18 + TypeScript + Vite frontend
    ├── src/
    │   ├── components/             # Reusable UI components & ProtectedRoute
    │   ├── context/                # AuthContext (state, token management)
    │   ├── features/
    │   │   ├── auth/               # Login & Register views
    │   │   ├── chat/               # Real-time chat workspace, groups, reactions, attachments
    │   │   ├── friends/            # Friend requests, accepted friends, and block manager
    │   │   ├── profile/            # Profile viewer, settings, and privacy toggle
    │   │   ├── notifications/      # Notification bell dropdown & unread badges
    │   │   ├── reports/            # User/message moderation report dialog
    │   │   └── admin/              # Admin dashboard, metrics, user table, audit logs
    │   ├── services/               # Axios REST client & STOMP WebSocket service
    │   └── types/                  # TypeScript interface definitions
    └── package.json
```

---

## 🚀 Quick Start Guide

### Option 1: Full Docker Compose (Recommended)

1. Clone the repository and navigate into the project directory:
   ```bash
   cd ChatX
   ```
2. Launch the entire platform:
   ```bash
   docker compose up --build -d
   ```
3. Access the platform:
   - **ChatX Web App**: `http://localhost`
   - **Backend API**: `http://localhost:8080/api`
   - **Swagger OpenAPI Docs**: `http://localhost:8080/swagger-ui.html`

---

### Option 2: Local Development

#### Prerequisites
- Java 21 or Java 25 (JDK)
- Apache Maven 3.9+
- Node.js 18+ & npm
- Docker (for MySQL & Redis)

#### 1. Start Infrastructure (MySQL & Redis)
```bash
docker compose up mysql redis -d
```

#### 2. Run Backend
```bash
cd chatx-backend
mvn spring-boot:run
```
*Backend runs on `http://localhost:8080`.*

#### 3. Run Frontend
```bash
cd chatx-frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Automated Testing

ChatX includes unit and integration tests covering business logic across every domain:

```bash
# Run all backend tests (43 unit tests)
cd chatx-backend
mvn test

# Run frontend production build & type checks
cd chatx-frontend
npm run build
```

---

## 🛡️ Security & Role Matrix

| Endpoint Group | Role Required | Description |
| :--- | :--- | :--- |
| `/api/auth/**` | Public | Login, registration, token refresh |
| `/api/files/**` (GET) | Public | Serves uploaded avatars and attachments |
| `/ws/**` | JWT STOMP Handshake | Authenticated WebSocket connection |
| `/api/conversations/**` | Authenticated (`USER`) | Private and group chat sessions |
| `/api/messages/**` | Authenticated (`USER`) | Messaging, editing, reactions |
| `/api/friends/**` | Authenticated (`USER`) | Friend requests, friendships |
| `/api/reports/**` | Authenticated (`USER`) | Submit abuse report |
| `/api/admin/**` | `ADMIN` / `SUPER_ADMIN` | Stats, user status, resolve reports, audit trail |

---

## 📜 License
MIT License. Built with clean software craftsmanship.
