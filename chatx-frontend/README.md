# ChatX Frontend — Modern Real-Time Web Application

[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-Latest-F05032?logo=lucide&logoColor=white)](https://lucide.dev/)

The **ChatX Frontend** is a responsive, feature-rich single-page application (SPA) built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Vite**. It features an ultra-modern dark cyber aesthetic with glassmorphism, animated micro-interactions, full-duplex STOMP WebSocket messaging, and dedicated administrative controls.

---

## 📑 Table of Contents

- [1. Feature Overview](#1-feature-overview)
- [2. Tech Stack & Key Libraries](#2-tech-stack--key-libraries)
- [3. Prerequisites](#3-prerequisites)
- [4. Step-by-Step Installation & Running](#4-step-by-step-installation--running)
- [5. Vite Reverse Proxy Architecture](#5-vite-reverse-proxy-architecture)
- [6. Application Architecture & Folder Layout](#6-application-architecture--folder-layout)
- [7. Pages & Route Hierarchy](#7-pages--route-hierarchy)
- [8. State Management & Networking](#8-state-management--networking)
  - [Authentication & Axios Interceptors](#authentication--axios-interceptors)
  - [Real-Time WebSocket & STOMP Service](#real-time-websocket--stomp-service)
- [9. Production Build & Docker Containerization](#9-production-build--docker-containerization)
- [10. Troubleshooting Common Issues](#10-troubleshooting-common-issues)

---

## 1. Feature Overview

- **Real-Time Messaging**: STOMP WebSocket messaging with optimistic updates, cursor-based scrollback, live typing indicators, and message reactions.
- **Rich Media Support**: Drag-and-drop file attachment uploads (images, audio, video, documents) with client-side previews before dispatch.
- **Social Graph & Friendships**: 4-tab relationship management (Accepted Friends, Incoming Requests, Sent Requests, Blocked Users).
- **Fast User Discovery**: Universal `Ctrl+K` modal with debounced 300ms prefix autocomplete search for `@handles`.
- **Admin Moderation Portal**: Dedicated dashboard at `/admin` for system metrics, user role/status toggles, report queues, and immutable audit logs.
- **Glassmorphic Cyber Aesthetic**: Tailwind CSS custom palette with dark surfaces, neon accents, smooth transitions, and toast notifications.

---

## 2. Tech Stack & Key Libraries

| Library | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `18.3.1` | Core UI view library |
| **TypeScript** | `5.5.4` | Strict type definitions and compile-time validation |
| **Vite** | `5.4.7` | Next-generation frontend bundler & dev server with instant HMR |
| **Tailwind CSS** | `3.4.12` | Utility-first responsive CSS styling with custom theme tokens |
| **@stomp/stompjs** | `7.0.0` | STOMP client over native WebSocket connection |
| **Axios** | `1.7.7` | Promise-based HTTP client with request/response interceptors |
| **React Router** | `6.26.2` | Declarative client-side routing & protected route guards |
| **Lucide React** | `0.441.0` | Scalable icon library |
| **Date-fns** | `3.6.0` | Lightweight date manipulation and relative timestamp formatting |
| **React Hot Toast**| `2.4.1` | Animated toast notification system |

---

## 3. Prerequisites

Before setting up the frontend, ensure your environment has:

- **Node.js**: Version `18.0.0` or higher (`20.x LTS` recommended). Check with `node -v`.
- **npm**: Version `9.0.0` or higher. Check with `npm -v`.
- **ChatX Backend**: The backend should ideally be running on `http://localhost:8088` (or port configured in `vite.config.ts`).

---

## 4. Step-by-Step Installation & Running

#### Step 1: Navigate to the Frontend Directory
```bash
cd chatx-frontend
```

#### Step 2: Install Node Dependencies
```bash
npm install
```

#### Step 3: Launch the Development Server
```bash
npm run dev
```

The terminal will report:
```text
  VITE v5.4.7  ready in 230 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

#### Step 4: Open the Application
Navigate to **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 5. Vite Reverse Proxy Architecture

To eliminate CORS issues during development and provide seamless WebSocket proxying, Vite is configured in [`vite.config.ts`](file:///d:/ChatX/chatx-frontend/vite.config.ts):

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8088',
        ws: true,
      },
    },
  },
});
```

- When the frontend calls `/api/auth/login`, Vite transparently proxies it to `http://localhost:8088/api/auth/login`.
- When the frontend opens a WebSocket to `ws://localhost:5173/ws`, Vite upgrades and tunnels the connection to `ws://localhost:8088/ws`.

> **Note**: If your backend runs on a different port (such as `8080`), change `target: 'http://localhost:8088'` to your chosen port in `vite.config.ts`.

---

## 6. Application Architecture & Folder Layout

The frontend follows a **Feature-Driven Modular Architecture**:

```text
chatx-frontend/
├── index.html                   # HTML entrypoint with font imports
├── vite.config.ts               # Vite bundler, path aliases, dev proxy
├── tailwind.config.js           # ChatX Dark Cyber theme tokens
├── package.json                 # Dependencies and npm scripts
├── nginx.conf                   # Nginx reverse proxy configuration for Docker
├── public/                      # Static brand assets and favicons
└── src/
    ├── App.tsx                  # Root application router and layout providers
    ├── main.tsx                 # React DOM root render
    ├── index.css                # Tailwind directives and custom scrollbar styles
    │
    ├── components/              # Shared reusable components
    │   ├── common/              # ProtectedRoute, Modals, LoadingSpinners
    │   └── layout/              # Sidebar, NavigationBar, Header
    │
    ├── context/
    │   └── AuthContext.tsx       # Authentication state, login, logout, user session
    │
    ├── features/                # Feature modules
    │   ├── admin/               # Admin portal: stats, user moderation, report queue, audit logs
    │   ├── auth/                # Login and Registration forms with validation
    │   ├── chat/                # Real-time chat view, messages, input, attachments, reactions
    │   ├── friends/             # Friend list, pending requests, block management
    │   ├── profile/             # User profile display and settings editor
    │   └── users/               # Global search modal (Ctrl+K) & public profile cards
    │
    ├── services/
    │   ├── api.ts               # Axios instance with JWT interceptor & auto-logout on 401
    │   └── websocket.ts         # STOMP client manager with reconnect logic
    │
    ├── types/                   # TypeScript interfaces (User, Message, Conversation, etc.)
    └── utils/                   # Formatting helpers, date transformers, constants
```

---

## 7. Pages & Route Hierarchy

| Path | Component | Guard | Description |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | Public | User authentication with `@handle` or email |
| `/register` | `RegisterPage` | Public | Account creation with real-time field validation |
| `/` | `ChatPage` | `ProtectedRoute` | Main application shell and chat room |
| `/chat/:conversationId` | `ChatPage` | `ProtectedRoute` | Direct or group chat room with active message history |
| `/friends` | `FriendsPage` | `ProtectedRoute` | 4-tab friend list and incoming/outgoing request manager |
| `/profile` | `ProfilePage` | `ProtectedRoute` | Current user profile details & bio editor |
| `/profile/:username` | `ProfilePage` | `ProtectedRoute` | Public profile view for any user handle |
| `/admin` | `AdminDashboardPage` | `AdminRoute` | High-privilege administration and moderation portal |

---

## 8. State Management & Networking

### Authentication & Axios Interceptors
- Tokens (`chatx_access_token` and `chatx_refresh_token`) are securely stored in `localStorage`.
- [`src/services/api.ts`](file:///d:/ChatX/chatx-frontend/src/services/api.ts) automatically attaches `Authorization: Bearer <token>` to outgoing requests.
- A response interceptor handles `401 Unauthorized` responses by invalidating local sessions and redirecting the browser to `/login`.

### Real-Time WebSocket & STOMP Service
- [`src/services/websocket.ts`](file:///d:/ChatX/chatx-frontend/src/services/websocket.ts) wraps `@stomp/stompjs`.
- It initiates the WebSocket handshake to `/ws` with the Bearer JWT in the `CONNECT` frame.
- Automatically handles reconnection backoff and channel resubscriptions when switching between conversation rooms.

---

## 9. Production Build & Docker Containerization

### Verify Types & Compile Production Assets:
```bash
npm run build
```
This runs `tsc` for complete type-checking and then outputs optimized minified static assets to `dist/`.

### Preview the Build:
```bash
npm run preview
```
Runs a local static preview on `http://localhost:4173`.

### Containerized Deployment (Docker + Nginx):
The [`Dockerfile`](file:///d:/ChatX/chatx-frontend/Dockerfile) builds the app in a multi-stage Node Alpine container and serves the assets using a lightweight Nginx server configured via [`nginx.conf`](file:///d:/ChatX/chatx-frontend/nginx.conf):

```bash
# Build Docker image
docker build -t chatx-frontend:latest .

# Run container on port 80
docker run -p 80:80 chatx-frontend:latest
```

---

## 10. Troubleshooting Common Issues

### Issue 1: Cannot Connect to API / 504 Gateway Error
- **Symptom**: Network error when logging in or registering.
- **Cause**: The Spring Boot backend is not running or is listening on a different port.
- **Fix**: Verify backend is running on `http://localhost:8088`. If running on port `8080`, edit the target in `vite.config.ts`:
  ```typescript
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true },
    '/ws': { target: 'http://localhost:8080', ws: true }
  }
  ```

### Issue 2: WebSocket STOMP Disconnected
- **Symptom**: Red presence indicator or console error `WebSocket connection to 'ws://localhost:5173/ws' failed`.
- **Cause**: Backend restarted, or the user's JWT access token has expired.
- **Fix**: Log out and log back in, or check the backend console logs.

### Issue 3: Port 5173 Already in Use
- **Symptom**: Vite starts on `http://localhost:5174` instead of `5173`.
- **Fix**: Terminate the previous process holding port 5173 or pass `--port 5173 --strictPort`.
