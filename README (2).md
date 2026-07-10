# Himalix Labs Unified Platform

> Nepal's premier technology solutions provider — Electronics Store, 3D Printing Studio, Engineering Projects Marketplace, and Portfolio CMS — unified into a single full-stack platform.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-4-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Project Structure](#project-structure)
7. [Database Schema](#database-schema)
8. [Backend API Reference](#backend-api-reference)
9. [Frontend Pages & Components](#frontend-pages--components)
10. [Authentication & Security](#authentication--security)
11. [E-Commerce System](#e-commerce-system)
12. [3D Printing Service](#3d-printing-service)
13. [Engineering Projects Marketplace](#engineering-projects-marketplace)
14. [Portfolio CMS](#portfolio-cms)
15. [Admin Panel](#admin-panel)
16. [Design System](#design-system)
17. [Deployment](#deployment)
18. [Security Audit](#security-audit)

---

## Overview

Himalix Labs Unified Platform is a full-stack monorepo containing:

- **Backend**: Express.js REST API with MySQL, JWT auth, file uploads, email system, and audit logging
- **Frontend**: React 18 SPA with Vite, lazy-loaded routes, dark/light theme, and Nepali/English i18n
- **Database**: 34-table MySQL schema with foreign keys, indexes, and JSON-validated columns

The platform serves as a complete digital presence for Himalix Labs, combining:

| Domain | Description |
|--------|-------------|
| **Electronics Store** | Full e-commerce with products, cart, checkout, coupons, wallet, reviews, wishlist |
| **3D Printing Studio** | File upload, real-time pricing, WebGL 3D preview, material selection, quotation workflow |
| **Engineering Projects** | Buy/rent tech projects with availability calendar, components, and custom requests |
| **Portfolio CMS** | Landing page content management, team, testimonials, services, contact form |
| **Admin Panel** | Unified admin console with 114+ API endpoints, analytics, batch operations, DB manager |
| **Support System** | Ticket-based helpdesk with message threads and admin replies |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                    │
│              Vite Dev Server :3000                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Portfolio │ │  Store   │ │  3D Print│ │  Admin   │   │
│  │  Pages    │ │  Pages   │ │  Pages   │ │  Panel   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│         │             │            │            │        │
│    ┌────┴─────────────┴────────────┴────────────┘       │
│    │       AuthContext  +  CartContext  +  Theme         │
│    └────────────────────┬───────────────────────────     │
└─────────────────────────┼───────────────────────────────┘
                          │  HTTP (Proxy in dev)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (Express.js)                    │
│                   Port 5000                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Middleware Pipeline                              │    │
│  │  IP Block → Correlation ID → Rate Limit →         │    │
│  │  Helmet → CORS → Body Parser → Routes             │    │
│  └──────────────────────┬──────────────────────────┘    │
│  ┌──────────────────────┴──────────────────────────┐    │
│  │  12 Feature Modules                              │    │
│  │  Auth │ Products │ Cart │ Orders │ Wishlist      │    │
│  │  Reviews │ Wallet │ Projects │ Printing │ CMS    │    │
│  │  Support │ Admin (3 files)                       │    │
│  └──────────────────────┬──────────────────────────┘    │
│  ┌──────────────────────┴──────────────────────────┐    │
│  │  Services: Storage │ Mail │ Audit │ Logger        │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              MySQL / MariaDB Database                     │
│              Database: himalix                             │
│              34 Tables │ 30 Foreign Keys                   │
│              47+ Indexes │ Fulltext Search                  │
└─────────────────────────────────────────────────────────┘
```

### Request Lifecycle

1. **IP Access Blocker** — Rejects direct IP access (enforces domain usage)
2. **Correlation ID** — Assigns `REQ-{hex12}` to every request for tracing
3. **IP Block Check** — Queries `blocked_ips` table for active blocks
4. **Rate Limiting** — 1000 req/15min global, stricter per-route
5. **Security Headers** — Helmet (CSP, HSTS, XSS filter, etc.)
6. **CORS** — Single-origin, credentials allowed
7. **Body Parsing** — JSON (1MB limit)
8. **Route Handlers** — Auth, validation, business logic
9. **Error Handler** — Catches all errors, returns structured JSON

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express.js | 4.18.2 | Web framework |
| MySQL2 | 3.6.0 | Database driver (promise-based) |
| bcryptjs | 2.4.3 | Password hashing (12 salt rounds) |
| jsonwebtoken | 9.0.2 | JWT creation/verification |
| Multer | 1.4.5-lts.1 | File upload handling |
| Nodemailer | 8.0.11 | Email sending (async queue) |
| Helmet | 8.2.0 | Security headers |
| CORS | 2.8.5 | Cross-origin configuration |
| express-rate-limit | 8.5.2 | Rate limiting |
| google-auth-library | 10.7.0 | Google OAuth verification |
| dotenv | 16.3.1 | Environment variable loading |
| nodemon | 3.0.1 | Dev auto-reload |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| React Router | 6.16.0 | Client-side routing |
| Vite | 4.4.5 | Build tool & dev server |
| Three.js | 0.185.1 | 3D model rendering |
| Leaflet | 1.9.4 | Interactive maps |
| react-leaflet | 4.2.1 | React Leaflet bindings |
| Framer Motion | 10.16.4 | Animations (declared, not actively used) |

### Database

| Technology | Purpose |
|------------|---------|
| MySQL 8.0 / MariaDB | Primary database |
| InnoDB engine | All tables (transaction support) |
| utf8mb4 charset | Full Unicode support (including emoji) |

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **MySQL** 8.0 or MariaDB 10.6+
- **npm** 9+
- (Optional) AWS S3 or Cloudflare R2 account for cloud file storage

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd himalix-lab-mimo

# Install root dependencies (concurrently)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Database Setup

```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE himalix;"

# Import the schema
mysql -u root -p himalix < database/himalix_latest_schema.sql
```

### Environment Configuration

```bash
# Copy the example env file
cp backend/.env.example backend/.env

# Edit with your settings (see Environment Variables section)
```

### Running the Application

```bash
# From the root directory — runs both backend and frontend concurrently
npm run dev

# Or run separately:
# Backend (port 5000)
cd backend && npm run dev

# Frontend (port 3000)
cd frontend && npm run dev
```

The frontend dev server proxies `/api` and `/uploads` requests to the backend automatically.

---

## Environment Variables

### Backend `.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Express server port |
| `DB_HOST` | Yes | `localhost` | MySQL host |
| `DB_USER` | Yes | `root` | MySQL username |
| `DB_PASSWORD` | Yes | `''` | MySQL password |
| `DB_NAME` | No | `himalix` | Database name |
| `JWT_SECRET` | Yes | — | HS256 JWT signing secret (min 32 bytes) |
| `FRONTEND_URL` | Yes | `http://localhost:3000` | Frontend origin for CORS |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `AWS_ACCESS_KEY_ID` | No | — | S3/R2 access key (enables cloud uploads) |
| `AWS_SECRET_ACCESS_KEY` | No | — | S3/R2 secret key |
| `AWS_S3_BUCKET` | No | — | S3/R2 bucket name |
| `AWS_S3_REGION` | No | `us-east-1` | S3/R2 region |
| `CDN_URL` | No | — | CDN prefix for uploaded file URLs |

### SMTP Configuration

SMTP settings are stored in the `site_settings` database table (admin-configurable at runtime):

| Setting Key | Default | Description |
|-------------|---------|-------------|
| `smtp_host` | — | SMTP server hostname |
| `smtp_port` | `587` | SMTP port |
| `smtp_user` | — | SMTP username |
| `smtp_pass` | — | SMTP password |
| `smtp_secure` | `'0'` | `'1'` for TLS |
| `smtp_forward_enabled` | `'1'` | Toggle contact form forwarding |

---

## Project Structure

```
himalix-lab-mimo/
├── backend/
│   ├── server.js                          # Entry point
│   ├── package.json
│   ├── .env                               # Environment variables (gitignored)
│   ├── .env.example                       # Environment template
│   ├── src/
│   │   ├── app.js                         # Express app setup, middleware, routes, SEO
│   │   ├── config/
│   │   │   ├── db.js                      # MySQL connection pool (15 connections)
│   │   │   └── mail.js                    # Nodemailer transport + async queue
│   │   ├── middleware/
│   │   │   ├── auth.js                    # JWT auth, admin check, RBAC
│   │   │   ├── errorHandler.js            # Global error handler
│   │   │   ├── rateLimiter.js             # 5 rate limiters
│   │   │   ├── security.js               # Correlation ID + IP block check
│   │   │   └── validate.js               # Custom schema validation
│   │   ├── modules/
│   │   │   ├── auth/                      # Authentication (4 files)
│   │   │   ├── admin/                     # Admin panel (3 files)
│   │   │   ├── portfolio/                 # Public content API
│   │   │   ├── products/                  # Product catalog
│   │   │   ├── cart/                      # Shopping cart
│   │   │   ├── orders/                    # Checkout & order management
│   │   │   ├── wishlist/                  # Wishlist
│   │   │   ├── reviews/                   # Product reviews
│   │   │   ├── wallet/                    # Wallet & referrals
│   │   │   ├── projects/                  # Engineering projects
│   │   │   ├── printing/                  # 3D printing service
│   │   │   └── support/                   # Helpdesk tickets
│   │   ├── services/
│   │   │   ├── storage.js                 # File upload (S3/R2 or local)
│   │   │   ├── audit.js                   # Hash-chained audit log
│   │   │   └── appLogger.js               # Activity logging
│   │   ├── utils/
│   │   │   ├── AppError.js                # Custom error class
│   │   │   ├── sanitize.js                # HTML escape, filename sanitize
│   │   │   ├── validation.js              # Input validators
│   │   │   ├── batchHelpers.js            # Transaction helpers
│   │   │   └── ip.js                      # Client IP extraction
│   │   └── scripts/                       # Database migrations (6 scripts)
│   └── uploads/                           # Local file uploads
│
├── frontend/
│   ├── index.html                         # HTML shell
│   ├── vite.config.js                     # Vite + React + proxy
│   ├── package.json
│   ├── public/
│   │   ├── logo.png                       # Brand logo
│   │   ├── placeholder.svg                # No-image placeholder
│   │   ├── 3d_placeholder.svg             # 3D print placeholder
│   │   ├── social_preview.png             # OG image
│   │   └── fontawesome/                   # FA 7.2.0 Pro (self-hosted)
│   └── src/
│       ├── index.js                       # Entry point (CSS imports + React mount)
│       ├── App.js                         # Root component (providers + routing)
│       ├── 3d/                            # 3D printing pages
│       ├── admin/                         # Admin panel (856 lines)
│       │   ├── UnifiedAdmin.js            # Admin shell with sidebar
│       │   ├── store/components/          # Store admin views
│       │   ├── project/components/        # Project admin views
│       │   ├── portfolio/components/      # CMS admin views
│       │   └── views/                     # Shared admin views
│       ├── auth/                          # Auth pages + AuthContext
│       ├── components/                    # 17 shared components
│       ├── context/                       # ThemeContext
│       ├── hooks/                         # 3 custom hooks
│       ├── locales/                       # i18n (EN + Nepali)
│       ├── portfolio/                     # Landing page
│       ├── project/                       # Project pages
│       ├── store/                         # E-commerce pages + CartContext
│       └── styles/                        # 12 CSS files
│
├── database/
│   └── himalix_latest_schema.sql          # Complete database schema (34 tables)
│
├── package.json                           # Root (concurrently)
└── SECURITY_AUDIT_REPORT.md               # OWASP security audit
```

---

## Database Schema

The database contains **34 tables** organized into logical domains.

### Entity Relationship Overview

```
users ──────────┬──────────── orders ──────────── order_items
                │                │                    │
                ├──────────── project_orders          ├─ products
                │                                    ├─ projects
                ├──────────── printing_orders         └─ (3D custom)
                │
                ├──────────── cart_items ──────── products
                │
                ├──────────── wishlist_items ──── products
                │
                ├──────────── reviews ─────────── products
                │
                ├──────────── wallet_transactions
                │
                ├──────────── social_claims
                │
                ├──────────── refresh_tokens
                │
                ├──────────── token_blacklist
                │
                ├──────────── user_addresses
                │
                ├──────────── support_tickets ── support_ticket_messages
                │
                └──────────── custom_project_requests

products ─────── coupons ──── coupon_usage ────── orders
projects ──────── project_components ─────────── products
                 project_blocked_dates

landing_content (CMS sections)
services (CMS services)
team_members (CMS team)
testimonials (CMS testimonials)
site_settings (key-value config)
contact_messages (contact form)
blocked_ips (IP blocklist)
audit_logs (hash-chained audit trail)
security_events (security incidents)
application_logs (activity logs)
```

### Tables by Domain

| Domain | Tables | Description |
|--------|--------|-------------|
| **Users & Auth** | `users`, `refresh_tokens`, `token_blacklist`, `blocked_ips` | User accounts, session management, security |
| **E-Commerce** | `products`, `orders`, `order_items`, `order_status_history`, `cart_items`, `wishlist_items`, `reviews`, `coupons`, `coupon_usage` | Full storefront with inventory, checkout, discounts |
| **Projects** | `projects`, `project_components`, `project_blocked_dates`, `project_orders`, `custom_project_requests` | Engineering project marketplace with rental calendar |
| **3D Printing** | `printing_orders` | 3D model uploads, material config, quotation workflow |
| **Wallet** | `wallet_transactions`, `social_claims` | Store credits, referral bonuses, social rewards |
| **CMS** | `landing_content`, `services`, `team_members`, `testimonials`, `site_settings`, `contact_messages` | Landing page content management |
| **Support** | `support_tickets`, `support_ticket_messages` | Ticket-based helpdesk |
| **Logging** | `audit_logs`, `security_events`, `application_logs` | Tamper-evident audit trail, security events, activity |
| **Addresses** | `user_addresses` | Multi-address support with coordinates |

### Key Schema Features

- **Soft deletes** on `users`, `products`, `orders`, `reviews` (preserves data with `deleted_at` timestamp)
- **JSON-validated columns** via `CHECK (json_valid(...))` on `technical_specs`, `features`, `technologies`, `image_urls`, `shipping_address`, `custom_responses`
- **Fulltext search** on `products` (`name`, `description`)
- **Hash-chained audit logs** — each entry's SHA-256 hash includes the previous entry's hash
- **Composite unique constraints** — `wishlist_items(user_id, product_id)`, `social_claims(user_id, platform)`, `landing_content(section, content_key)`
- **Foreign keys** with cascading deletes on related data

---

## Backend API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | No | Register with email/password (rate limited: 5/15min) |
| `POST` | `/login` | No | Login (rate limited: 15/15min) |
| `POST` | `/google` | No | Google OAuth sign-in |
| `POST` | `/verify-email` | No | Verify email with 6-digit OTP |
| `POST` | `/resend-otp` | No | Resend verification OTP (1-min cooldown) |
| `POST` | `/refresh` | No | Rotate refresh token (reuse detection) |
| `POST` | `/logout` | No | Blacklist token + revoke refresh |
| `GET` | `/config` | No | Public site config (redacted for non-browser) |
| `POST` | `/forgot-password` | No | Send password reset email |
| `POST` | `/reset-password` | No | Reset password with token |
| `GET` | `/me` | Yes | Get current user profile + wallet |
| `PUT` | `/update` | Yes | Update profile (name, phone, address, avatar) |
| `PUT` | `/password` | Yes | Change password (revokes all sessions) |
| `POST` | `/upload-avatar` | Yes | Upload avatar image (5MB limit) |

### Public Content (`/api/content`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | No | All landing page CMS content |
| `GET` | `/section/:section` | No | Single CMS section |
| `POST` | `/contact` | No | Submit contact form (rate limited: 3/hr) |
| `GET` | `/search` | No | Universal search (products, projects, blogs) |

### Store Products (`/api/store/products`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | No | List products (search, filter, sort, paginate) |
| `GET` | `/:id` | No | Get product by ID or slug |

### Shopping Cart (`/api/store/cart`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Yes | Get cart items |
| `POST` | `/` | Yes | Add to cart |
| `PUT` | `/update` | Yes | Update item quantity |
| `DELETE` | `/remove/:id` | Yes | Remove item |
| `DELETE` | `/` | Yes | Clear cart |
| `POST` | `/sync` | Yes | Sync guest cart on login |

### Orders (`/api/store/orders`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/track/:code` | No | Track order by code |
| `POST` | `/checkout` | Yes | Full checkout (stock lock, tax, shipping, coupons, wallet) |
| `GET` | `/history` | Yes | User's order history |
| `GET` | `/shipping` | Yes | Calculate shipping (Haversine distance) |
| `POST` | `/apply-coupon` | Yes | Validate coupon code |

### Wishlist (`/api/store/wishlist`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Yes | Get wishlist |
| `POST` | `/` | Yes | Add to wishlist |
| `DELETE` | `/:productId` | Yes | Remove from wishlist |

### Reviews (`/api/store/reviews`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/:product_id` | No | Get product reviews |
| `POST` | `/:product_id` | Yes | Submit review (1-5 stars, requires delivered order) |
| `PUT` | `/review/:id` | Yes | Edit own review |
| `DELETE` | `/review/:id` | Yes | Delete own review |

### Wallet (`/api/store/wallet`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Yes | Wallet balance + referral info |
| `GET` | `/history` | Yes | Transaction history |
| `POST` | `/referral` | Yes | Apply referral code |
| `POST` | `/claim-social` | Yes | Claim social media reward |

### Projects (`/api/project`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | No | List projects (filter, sort) |
| `GET` | `/:id` | No | Get project details |
| `GET` | `/:id/availability` | No | Get rental availability |
| `POST` | `/:id/order` | Yes | Buy or rent project |
| `POST` | `/custom-request` | No | Submit custom project request |
| `GET` | `/orders/my` | Yes | User's project orders |

### 3D Printing (`/api/3d`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Yes | User's print orders |
| `POST` | `/upload` | Yes | Upload 3D model (20MB, .stl/.obj/.3mf/.stp/.step) |
| `POST` | `/` | Yes | Place print order |
| `POST` | `/checkout/:id` | Yes | Approve quote & pay with wallet |

### Support (`/api/support`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Yes | List user's tickets |
| `GET` | `/:id` | Yes | Get ticket with messages |
| `POST` | `/` | Yes | Create ticket |
| `POST` | `/:id/reply` | Yes | Reply to ticket |
| `PUT` | `/:id/close` | Yes | Close ticket |

### Admin Panel (`/api/admin`, `/api/store/admin`)

**114 admin endpoints** covering:

- **Dashboard**: Analytics, command center, stats
- **Products**: CRUD + inventory + low stock alerts
- **Orders**: List, status updates, cancellation with stock restoration + wallet refunds
- **Users**: CRUD, role changes, password resets, wallet credits, soft deletes
- **Projects**: CRUD, components, orders, blocked dates, custom requests
- **CMS**: Content sections, services, team, testimonials, site settings
- **Coupons**: Full CRUD with usage limits
- **3D Printing**: Order management, quotation pricing
- **Support**: Ticket management, admin replies
- **CRM**: Web inquiries, messages, revisions
- **Database**: Direct table manager (with blocked table protection), SQL backup
- **Batch Operations**: Batch delete, status update, toggle active, role change
- **Logs**: Activity logs, notifications, combined transaction logs
- **Settings**: Google Auth, SMTP, tax rates, delivery config, 3D printing rates, social rewards

### SEO Endpoints (in `app.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sitemap.xml` | Dynamic XML sitemap (products + projects) |
| `GET` | `/robots.txt` | Dynamic robots.txt with crawl directives |

---

## Frontend Pages & Components

### Page Routes

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/` | Landing | Public | Portfolio homepage with hero, services, team, testimonials, contact |
| `/signin` | Signin | Public | Email/password + Google OAuth login |
| `/signup` | Signup | Public | Registration with referral code |
| `/verify-email` | VerifyEmail | Public | 6-digit OTP verification |
| `/reset-password` | ResetPassword | Public | Password reset via token |
| `/3d` | ThreeDService | Public* | 3D printing studio with WebGL preview |
| `/project` | ProjectList | Public | Project catalog with search/filter |
| `/project/:id` | ProjectDetail | Public* | Project detail with rental calendar |
| `/store` | Storefront | Public | Product catalog with categories |
| `/store/product/:id` | ProductDetail | Public* | Product detail with reviews/wishlist |
| `/store/cart` | Cart | Private | Multi-step checkout |
| `/store/profile` | Profile | Private | 8-tab user dashboard |
| `/store/track` | Track | Public | Order tracking by code |
| `/store/terms` | Terms | Public | Terms & Conditions |
| `/store/eula` | Eula | Public | End User License Agreement |
| `/admin/*` | UnifiedAdmin | Admin | Full admin console |
| `*` | NotFound | Public | 404 page |

*Login required for cart/checkout/wishlist/review actions

### Shared Components (17)

| Component | Description |
|-----------|-------------|
| `Navbar` | Responsive navigation with search, cart, wallet, profile dropdown, mobile drawer |
| `Footer` | Site-wide footer with links and branding |
| `LoadingScreen` | Animated splash screen with progress bar |
| `SEO` | Dynamic meta tags, OpenGraph, Twitter Cards, JSON-LD |
| `Breadcrumbs` | Navigation breadcrumbs with Schema.org JSON-LD |
| `Pagination` | Reusable page navigation with ellipsis |
| `ScrollReveal` | IntersectionObserver-based scroll animation |
| `AnimatedCounter` | Count-up animation on scroll into view |
| `InteractiveCanvas` | Particle network canvas animation |
| `SmoothScroll` | Inertia-based smooth scrolling wrapper |
| `PrivateRoute` | Auth-required route guard |
| `AdminRoute` | Admin-only route guard |
| `NotFound` | 404 error page |
| `LocationPicker` | Leaflet map with draggable marker |
| `RentalCalendar` | Date range picker for rental availability |
| `ImageUploadZone` | Drag-drop + URL paste image uploader |
| `FileUploadZone` | Enhanced drag-drop file uploader |

### Context Providers (4)

| Provider | State | Persistence | Purpose |
|----------|-------|-------------|---------|
| `LanguageContext` | `locale` (`en`/`ne`) | `localStorage` | i18n with dot-path translation keys |
| `ThemeContext` | `theme` (`dark`/`light`) | `localStorage` | Dark/light mode via `data-theme` attribute |
| `AuthContext` | `user`, `token`, `systemConfig` | HttpOnly cookies | Auth state, auto-refresh, `authFetch()` |
| `CartContext` | `items` | Server (auth) / localStorage (guest) | Cart with guest-to-user sync |

### Custom Hooks (3)

| Hook | Returns | Purpose |
|------|---------|---------|
| `useScrollAnimation` | `{ ref, isInView }` | IntersectionObserver visibility detection |
| `useParallax` | `{ ref, offset }` | Scroll-driven parallax offset |
| `useBatchSelection` | `{ selectedIds, toggleSelect, ... }` | Multi-select for admin batch ops |

---

## Authentication & Security

### Authentication Flow

```
Register → Email OTP (6-digit, 15-min expiry) → Login
                                                    │
Login → Password check → Account lockout (5 fails = 15-min lock)
       → Email verification check → JWT access token (15 min)
       → Refresh token (30 days, SHA-256 hashed in DB)
```

### Security Features

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | bcrypt with 12 salt rounds |
| **JWT Access Tokens** | 15-minute expiry, issuer/audience validation |
| **Refresh Tokens** | 80-char hex, SHA-256 hashed in DB, 30-day expiry |
| **Token Rotation** | Old token revoked with `replaced_by` link |
| **Reuse Detection** | Stolen refresh token → revoke ALL user sessions |
| **Grace Window** | 10-second tolerance for parallel browser requests |
| **Token Blacklisting** | SHA-256 hash on logout, checked on every auth request |
| **Brute Force Protection** | 20 failed logins from same IP → 1-hour IP block |
| **Account Lockout** | 5 failed password attempts → 15-minute lock |
| **Registration Limit** | 3 accounts per IP per day |
| **OTP Cooldown** | 1-minute minimum between OTP resends |
| **Account Enumeration Prevention** | Generic messages for forgot-password and resend-OTP |
| **Rate Limiting** | 5 limiters (1000/15min general, 15/15min auth, 5/15min register, 3/5min checkout, 3/hr contact) |
| **IP Blocking** | Database-driven, checked on every request |
| **Direct IP Access Block** | Rejects raw IP in Host header |
| **Security Headers** | Helmet (CSP, HSTS, XSS filter, nosniff, referrer policy) |
| **Input Validation** | Custom schema validator + HTML sanitization |
| **SQL Injection Prevention** | Parameterized queries + column name validation |
| **Audit Logging** | Hash-chained SHA-256 audit trail (tamper-evident) |
| **Security Event Logging** | With immediate email alerts to admins |
| **CORS** | Single-origin, credentials allowed |
| **Soft Deletes** | Users, products, orders, reviews preserved |
| **Force Sign-out** | Password change/reset/role change revokes all sessions |

### Role-Based Access Control

| Role | Permissions |
|------|------------|
| `admin` | `manage_users`, `manage_products`, `manage_orders`, `manage_settings`, `manage_portfolio`, `view_logs` |
| `customer` | (none — standard user access) |

---

## E-Commerce System

### Checkout Flow

1. **Cart Loading** — Fetch all cart items (products, projects, 3D prints)
2. **Stock Verification** — Pessimistic `FOR UPDATE` row locks on products
3. **Double-Booking Check** — For rental projects, check overlap in both legacy and unified tables
4. **Subtotal Calculation** — Sum of price × quantity
5. **Tax Calculation** — Configurable sales tax rate (default 13% VAT Nepal)
6. **Shipping Calculation** — Haversine distance from HQ (27.7029°N, 85.3072°E), free over threshold
7. **Coupon Application** — Fixed or percentage discount with usage limits
8. **Wallet Deduction** — If `store_credit`, verify sufficient balance
9. **Tracking Code** — Format: `HMX-{timestamp}-{random}`
10. **Order Creation** — Transactional insert with line items
11. **Stock Adjustment** — Decrement inventory, manage rental status
12. **Address Auto-Save** — Update or create default user address
13. **Post-Commit** — Email confirmation, admin notification, low-stock alerts

### Payment Methods

| Method | How It Works |
|--------|-------------|
| `cash` | Pay on delivery. Order created as `unpaid`. |
| `store_credit` | Deducts from wallet balance. Immediate `paid` status. Refundable on cancellation. |

### Shipping

- **Algorithm**: Haversine great-circle distance from Kathmandu HQ
- **Configurable**: Per-km rate, minimum charge, free shipping threshold
- **ETA**: Distance-based (1-3 days)

### Coupons

- **Types**: Fixed amount or percentage
- **Limits**: Usage limit, per-user limit, date range, minimum order amount
- **Max discount cap** for percentage coupons

---

## 3D Printing Service

### Supported Materials

| Material | Density (g/cm³) | Typical Use |
|----------|-----------------|-------------|
| PLA | 1.24 | Prototypes, general purpose |
| PETG | 1.27 | Functional parts, chemical resistance |
| ABS | 1.04 | High-temperature applications |
| Resin | 1.20 | High-detail models |
| ASA | 1.07 | UV-resistant outdoor parts |
| TPU | 1.21 | Flexible, elastic parts |

### Client-Side Features

- **3D Model Parsing**: STL, OBJ, 3MF format support via Three.js loaders
- **Volume Calculation**: Signed tetrahedron method for accurate volume
- **Real-Time Pricing**: `setupFee + (volume × density × infill × qty × 1.20) × materialRate`
- **WebGL Preview**: Interactive 3D viewer with OrbitControls, auto-rotate, material-based rendering
- **Unit Auto-Detection**: mm, cm, in, m with manual override

### Workflow

1. User uploads 3D model file
2. Client-side mesh parsing calculates volume and bounding box
3. User configures material, color, infill, layer height, quantity
4. Real-time price estimation
5. Order placed with `pending_review` status
6. Admin reviews and sets quotation price
7. User approves quote and pays with wallet
8. Order moves to `printing` → `completed`

---

## Engineering Projects Marketplace

### Project Types

| Type | Description |
|------|-------------|
| `sale` | One-time purchase with stock quantity |
| `rent` | Time-based rental with availability calendar |

### Rental System

- **Calendar**: Shows booked/available dates with admin-blocked ranges
- **Deposit**: 1.5× weekly rental rate
- **Duration Pricing**: `(weeklyPrice / 7) × days + deposit`
- **Double-Booking Prevention**: Checks both legacy `project_orders` and unified `orders` tables
- **Slot Management**: Automatic status updates on checkout/completion/cancellation

### Custom Project Requests

- Types: `software`, `hardware`, `embedded`
- Collects: name, email, phone, project name, type, description, detailed requirements
- Admin workflow: pending → contacted → completed/cancelled

---

## Portfolio CMS

### Content Management

The landing page is fully CMS-driven with admin-editable sections:

| Entity | Fields | Features |
|--------|--------|----------|
| **Landing Content** | Section-based key-value pairs | Bulk update, JSON support |
| **Services** | Title, description, icon, features, link | CRUD, reorder, batch operations |
| **Team Members** | Name, role, bio, image, social links | CRUD, reorder, batch operations |
| **Testimonials** | Client name, title, company, content, rating | CRUD, reorder, batch operations |
| **Site Settings** | Key-value config (188+ settings) | Runtime-configurable, no restart needed |
| **Contact Messages** | Name, email, subject, message | Rate-limited (3/hr), email forwarding |

### Public API

All CMS content is served through `/api/content` which returns:
- All active landing page sections
- Active services sorted by display order
- Active team members with parsed social links
- Active testimonials sorted by display order
- All site settings as key-value pairs

---

## Admin Panel

### UnifiedAdmin Structure

A single-page admin console with a collapsible sidebar organized into 8 workflow groups:

| Group | Views |
|-------|-------|
| **Overview** | Dashboard with stats cards |
| **Orders & Requests** | Unified Orders (all types in one table) |
| **Catalog** | Store Products, Project Catalog, Custom Requests |
| **Communications** | Inbox & Support (tickets + contact messages + CRM) |
| **Customers** | User Accounts, Product Reviews |
| **Website CMS** | Hero & About, Team Members, Testimonials |
| **Settings** | System Config, 3D Print Config, Coupon Codes, Email Alerts, Project Alerts |
| **System** | Activity Logs, Database Manager |

### Admin Capabilities

- **Analytics Dashboard**: Revenue, orders by status, 7-day charts, top products, category breakdown
- **Command Center**: Pending orders across all services, low stock alerts, open tickets
- **Batch Operations**: Delete, status update, toggle active, role change across all entity types
- **Database Manager**: Direct table CRUD with column validation and blocked table protection
- **SQL Backup**: Full database dump with sensitive field redaction
- **CSV Export**: Client-side CSV generation for data tables
- **Activity Logs**: Paginated, filterable by action type, search, date range
- **SMTP Testing**: Verify email credentials from the admin panel

### Admin Security

- Blocked table protection: `users`, `wallet_transactions`, `refresh_tokens`, `token_blacklist`, `audit_logs` cannot be modified via DB manager
- Read blocking: `refresh_tokens`, `token_blacklist`, `audit_logs` hidden from DB reads
- Self-protection: Admins cannot delete themselves, change their own role, or modify their own account via batch ops
- Password/secret masking in settings and user table views
- Security alert emails for role changes, password resets, user deletions

---

## Design System

### Philosophy

**"Bugatti-Inspired Austere Luxury"** — monochrome palette, zero border-radius (except pill buttons), sharp edges, premium easing curves.

### Color Tokens

| Token | Dark Mode | Light Mode |
|-------|-----------|------------|
| `--bg-0` | `#000000` | `#ffffff` |
| `--bg-1` | `#0d0d0d` | `#f7f7f7` |
| `--bg-2` | `#141414` | `#ffffff` |
| `--bg-3` | `#1f1f1f` | `#f0f0f0` |
| `--bg-4` | `#262626` | `#e5e5e5` |
| `--text-0` | `#ffffff` | `#000000` |
| `--text-1` | `#cccccc` | `#333333` |
| `--text-2` | `#999999` | `#666666` |
| `--text-3` | `#666666` | `#999999` |
| `--success` | `#5fa657` | `#5fa657` |
| `--danger` | `#d9534f` | `#d9534f` |
| `--warning` | `#d4a017` | `#d4a017` |
| `--info` | `#c3d9f3` | `#3a7bd5` |

### Typography

| Role | Font | Weights |
|------|------|---------|
| Body | EB Garamond (serif) | 400, 500, italic 400 |
| Display / Headings | Saira Condensed (sans-serif) | 400, 500, 600 |
| Monospace / UI | JetBrains Mono | 400, 500, 600 |

All headings are uppercase with letter-spacing. Prices and technical data use monospace.

### Border Radius

- **Global**: `0px` (zero border-radius)
- **Buttons only**: `9999px` (pill shape)

### Icon System

Font Awesome 7.2.0 Pro (self-hosted), primarily using:
- `fa-light fa-sharp` — primary icon style
- `fa-solid` — badges and checkboxes
- `fa-brands` — social media icons

### Animations

All custom-built (no animation library in active use):
- CSS keyframes: `fadeInUp`, `float`, `spin`, `slideInRight`, `skeleton-shimmer`
- IntersectionObserver scroll reveal
- requestAnimationFrame counters and parallax
- Canvas particle network (mouse-reactive)
- Premium easing: `cubic-bezier(0.25, 1, 0.5, 1)`

### Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `>1440px` | Full 4-column grids |
| `≤1024px` | Admin sidebar collapses, 3→2 columns |
| `≤992px` | Nav hamburger, project layout stacks |
| `≤768px` | 2→1 column, reduced padding |
| `≤639.98px` | Mobile-first: tables become cards, single column |

---

## Deployment

### Production Checklist

1. Set `NODE_ENV=production` in `.env`
2. Generate a strong `JWT_SECRET` (min 32 bytes)
3. Configure MySQL with a non-root user and strong password
4. Set `FRONTEND_URL` to your production domain
5. Configure SMTP in `site_settings` table via admin panel
6. (Optional) Set AWS S3/R2 credentials for cloud file storage
7. Build frontend: `cd frontend && npm run build`
8. Serve frontend build with Nginx or similar
9. Start backend: `cd backend && npm start`

### Nginx Proxy Example

```nginx
server {
    listen 80;
    server_name himalixlabs.tech;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
    }
}
```

### Database Migrations

Located in `backend/src/scripts/`:

| Script | Purpose |
|--------|---------|
| `ecommerce_fixes_migration.js` | Project order rental columns, stock |
| `alter_stock_type.js` | Add `out_of_stock` to product stock_type |
| `add_wallet_balance_column.js` | Add wallet_balance to users |
| `migrate_uploads.js` | Restructure uploads into subdirectories |
| `export_schema.js` | Export live DB schema to SQL file |
| `sync_wallet_balances.js` | Recalculate wallet balances from ledger |

---

## Security Audit

A comprehensive OWASP-based security audit was conducted. For full details, see [`SECURITY_AUDIT_REPORT.md`](SECURITY_AUDIT_REPORT.md).

### Summary

| Severity | Found | Remediated | Remaining |
|----------|-------|------------|-----------|
| Critical | 2 | 2 | 0 |
| High | 5 | 5 | 0 |
| Medium | 13 | 13 | 0 |
| Low | 10 | 0 | 10 |
| Info | 5 | 0 | 5 |
| **Total** | **35** | **20** | **15** |

### Key Remediations Applied

- Replaced `Math.random()` with `crypto.randomBytes()` for all security-sensitive operations
- Upgraded bcrypt salt rounds from 10 to 12
- Added JWT issuer/audience validation
- Implemented token reuse detection with session revocation
- Added session invalidation on password change/reset
- Sensitive field redaction in database backups
- Input sanitization on contact form
- Account enumeration prevention on forgot-password and resend-OTP

---

## License

Proprietary — Himalix Labs. All rights reserved.

---

*Generated by OpenCode AI — 20 subagents explored every file, component, API endpoint, database table, and design token in this project.*
