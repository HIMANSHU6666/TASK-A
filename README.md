# LeadOS — Lead Management Platform

> **Digital Heroes — Role 04 / Full Stack Development — Task A**

A production-grade lead management application built for small sales teams. Not just a form — a full pipeline with role-based access, a documented JSON API, automated tests, and a live deployment.

🔗 **Live Demo**: https://leados-frontend.onrender.com

---

## Demo Credentials

| Role   | Email              | Password     |
|--------|--------------------|--------------|
| Admin  | admin@demo.com     | Admin@1234   |
| Member | member@demo.com    | Member@1234  |

> The login page has **one-click demo fill buttons** — just click "👑 Admin" or "👤 Member" then Sign in.

---

## Features

- **Public capture form** — Anyone can submit a lead without an account
- **Two roles: admin + member** — Enforced on both client and server
  - Admin sees all leads, assigns to members, can view and change everything
  - Member sees only leads assigned to them
- **Lead pipeline** — `new → contacted → qualified → proposal → won / lost`
- **Assignment** — Admin assigns a lead to any team member with a timestamped activity record
- **Notes** — Append-only notes with author and timestamp (cannot be edited/deleted)
- **Activity trail** — Every action logged: creation, status change, assignment, note added
- **Paginated, filterable API** — Search, status filter, pagination with metadata
- **Automated tests** — Auth rules + 2 complete end-to-end flows

---

## Project Structure

```
taskA/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── models/          User.js, Lead.js
│   │   ├── middleware/      auth.js, roles.js
│   │   ├── controllers/     authController.js, leadController.js, userController.js
│   │   └── routes/          auth.js, leads.js, users.js
│   ├── tests/
│   │   ├── auth.test.js     (11 tests)
│   │   └── leads.test.js    (14 tests)
│   ├── seed.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/index.js
    │   ├── context/AuthContext.jsx
    │   ├── components/      Navbar, StatusBadge, ActivityFeed, AssignModal, NoteForm, ProtectedRoute
    │   └── pages/           CapturePage, RegisterPage, LoginPage, DashboardPage, LeadDetailPage
    └── package.json
```

---

## Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas URI 

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — add your MONGODB_URI and a strong JWT_SECRET
npm run dev       # starts on http://localhost:5000
```

### 2. Seed demo data

```bash
cd backend
node seed.js
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev       # starts on http://localhost:5173
```

---

## Running Tests

```bash
cd backend
npm test
```

Tests use **mongodb-memory-server** — no real database connection needed. All 25 tests run in under 15 seconds.

```
PASS  tests/auth.test.js
  POST /api/auth/register (3)
  POST /api/auth/login (3)
  GET /api/auth/me (3)
  Role enforcement (2)

PASS  tests/leads.test.js
  POST /api/leads - public form (2)
  FLOW 1: submit → admin sees → assigns (4)
  FLOW 2: note → status → activity trail (4)
  Pagination & filtering (3)
```

---

## API Documentation

**Base URL**: `https://your-api.onrender.com/api`

All protected endpoints require: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint          | Auth | Body                          | Returns              |
|--------|-------------------|------|-------------------------------|----------------------|
| POST   | `/auth/register`  | –    | `{name, email, password, role?}` | `{token, user}`   |
| POST   | `/auth/login`     | –    | `{email, password}`           | `{token, user}`      |
| GET    | `/auth/me`        | ✓    | –                             | `{user}`             |

### Leads

| Method | Endpoint                    | Auth | Role         | Description                        |
|--------|-----------------------------|------|--------------|------------------------------------|
| POST   | `/leads`                    | –    | Public       | Submit lead via capture form        |
| GET    | `/leads`                    | ✓    | admin/member | List leads (admin: all, member: assigned) |
| GET    | `/leads/:id`                | ✓    | admin/member | Get single lead with notes + activity |
| PATCH  | `/leads/:id/status`         | ✓    | admin/member | Update pipeline status              |
| PATCH  | `/leads/:id/assign`         | ✓    | **admin**    | Assign lead to a user              |
| POST   | `/leads/:id/notes`          | ✓    | admin/member | Append a note                      |
| GET    | `/leads/:id/activity`       | ✓    | admin/member | Get activity trail                 |

### Query Parameters for `GET /leads`

| Param    | Type   | Description                          |
|----------|--------|--------------------------------------|
| `page`   | number | Page number (default: 1)            |
| `limit`  | number | Items per page (default: 10, max: 100) |
| `status` | string | Filter: `new\|contacted\|qualified\|proposal\|won\|lost` |
| `search` | string | Search name, email, company (case-insensitive) |
| `assignee` | ObjectId | Filter by assignee (admin only) |

### Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

### HTTP Status Codes Used

| Code | Meaning                                 |
|------|-----------------------------------------|
| 200  | OK                                      |
| 201  | Created                                 |
| 400  | Bad request (missing/invalid fields)    |
| 401  | Unauthenticated (no/invalid/expired token) |
| 403  | Forbidden (wrong role)                  |
| 404  | Not found                               |
| 409  | Conflict (e.g. duplicate email)         |
| 500  | Internal server error                   |

---

## Deployment (Render)

### Backend
1. Create a **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo, root directory: `taskA/backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables:
   - `MONGODB_URI` — your Atlas connection string
   - `JWT_SECRET` — any long random string
   - `CLIENT_URL` — your frontend Render URL
   - `NODE_ENV=production`

### Frontend
1. Create a **Static Site** on Render
2. Root directory: `taskA/frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variable:
   - `VITE_API_URL` — your backend Render URL + `/api`

### After deploying
Run the seed script once to populate demo data:
```bash
MONGODB_URI=<your_atlas_uri> node seed.js
```

---

## Design Decisions

- **JWT over sessions**: Stateless, works seamlessly with a separate frontend deployment
- **Embedded notes + activity**: Avoids extra collections for append-only data; simplifies reads
- **`select: false` on password**: Password is never accidentally returned in any query
- **Same error message for wrong email/password**: Prevents email enumeration attacks
- **mongodb-memory-server for tests**: Zero external dependencies for CI; tests run anywhere
- **Seed script separate from app**: Production server never runs seed logic

---

## AI Usage

I used Antigravity (Google DeepMind's AI coding assistant) to help scaffold and write the majority of this codebase. My contribution was in the architectural decisions: choosing embedded documents for notes/activity over separate collections, designing the role-permission matrix (what admin vs member can do on both server and client), structuring the test flows to cover the exact requirements in the brief, and reviewing every file for correctness before finalizing. The design system and UI layout were also directed by me with AI handling the implementation.
