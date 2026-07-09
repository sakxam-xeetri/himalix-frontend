# Himalix Labs — Complete Backend API Reference

> This document contains every API endpoint, route, service, middleware, and backend system in the Himalix Labs platform. Generated from full codebase analysis.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Environment Variables](#environment-variables)
4. [Middleware Pipeline](#middleware-pipeline)
5. [Authentication System](#authentication-system)
6. [API Routes — Complete Reference](#api-routes--complete-reference)
7. [Services Layer](#services-layer)
8. [Database Schema](#database-schema)
9. [File Upload System](#file-upload-system)
10. [Email System](#email-system)
11. [Security Measures](#security-measures)
12. [Admin Panel](#admin-panel)
13. [Scripts & Migrations](#scripts--migrations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Backend (Express.js)                    │
│                   Port 5000                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Middleware Pipeline                              │    │
│  │  IP Block → Correlation ID → Rate Limit →         │    │
│  │  Helmet → CORS → Body Parser → Routes             │    │
│  └──────────────────────┬──────────────────────────┘    │
│  ┌──────────────────────┴──────────────────────────┐    │
│  │  14 Feature Modules                              │    │
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
│              34 Tables │ 30+ Foreign Keys                  │
│              47+ Indexes │ Fulltext Search                  │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

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

---

## Environment Variables

### Server Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Express server port |
| `FRONTEND_URL` | Yes | `http://localhost:3000` | Frontend origin for CORS |
| `NODE_ENV` | No | `development` | `development` or `production` |

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | `localhost` | MySQL host |
| `DB_USER` | Yes | `root` | MySQL username |
| `DB_PASSWORD` | Yes | `''` | MySQL password |
| `DB_NAME` | No | `himalix` | Database name |

### JWT

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | — | HS256 JWT signing secret (min 32 bytes) |

### Google OAuth

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |

### AWS S3 / Cloudflare R2 (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | No | — | S3/R2 access key (enables cloud uploads) |
| `AWS_SECRET_ACCESS_KEY` | No | — | S3/R2 secret key |
| `AWS_S3_BUCKET` | No | — | S3/R2 bucket name |
| `AWS_S3_REGION` | No | `us-east-1` | S3/R2 region |
| `CDN_URL` | No | — | CDN prefix for uploaded file URLs |

### SMTP (Stored in DB)

SMTP settings are stored in the `site_settings` database table (admin-configurable at runtime):

| Setting Key | Default | Description |
|-------------|---------|-------------|
| `smtp_host` | — | SMTP server hostname |
| `smtp_port` | `587` | SMTP port |
| `smtp_user` | — | SMTP username |
| `smtp_pass` | — | SMTP password |
| `smtp_secure` | `'0'` | `'1'` for TLS |
| `smtp_forward_enabled` | `'1'` | Toggle contact form forwarding |

### Store Settings (Stored in DB)

| Setting Key | Default | Description |
|-------------|---------|-------------|
| `tax_rate` | `0.13` | 13% VAT (Nepal) |
| `shipping_fee` | `100` | Default shipping fee in NPR |
| `delivery_per_km_rate` | — | Distance-based shipping rate |
| `delivery_min_charge` | — | Minimum shipping charge |
| `delivery_free_threshold` | — | Free shipping order threshold |
| `referral_bonus_amount` | `100.00` | Wallet bonus for referral |
| `social_youtube_reward` | `50.00` | YouTube follow reward |
| `social_instagram_reward` | `25.00` | Instagram follow reward |
| `social_facebook_reward` | `50.00` | Facebook follow reward |

---

## Middleware Pipeline

### Global Middleware (app.js)

| Order | Middleware | File | Purpose |
|-------|-----------|------|---------|
| 1 | Hostname verification | `app.js:14-27` | Blocks direct IP access (enforces domain usage) |
| 2 | `correlationIdMiddleware` | `security.js:6-12` | Assigns `REQ-{hex12}` to every request for tracing |
| 3 | `ipBlockCheckMiddleware` | `security.js:15-46` | Queries `blocked_ips` table for active blocks |
| 4 | `apiLimiter` | `rateLimiter.js:21` | 1000 req/15min global rate limit |
| 5 | `helmet` | `app.js:37-59` | Security headers (CSP, HSTS, XSS filter, etc.) |
| 6 | `cors` | `app.js:62` | Single-origin CORS, credentials allowed |
| 7 | `express.json` | `app.js:63` | JSON body parser (1MB limit) |
| 8 | Static file serving | `app.js:66-67` | `/uploads` and `/api/uploads` serve files |
| 9 | Route handlers | `app.js:70-87` | Auth, validation, business logic |
| 10 | `errorHandler` | `app.js:180` | Catches all errors, returns structured JSON |

### Rate Limiters

| Limiter | Window | Max Requests | Message | Applied To |
|---------|--------|-------------|---------|------------|
| `apiLimiter` | 15 min | 1000 | Generic rate limit message | All `/api/` routes |
| `authLimiter` | 15 min | 15 | Login attempt limit | Login, verify, reset, Google, config |
| `registerLimiter` | 15 min | 5 | Registration limit | `/api/auth/register` |
| `checkoutLimiter` | 5 min | 3 | Checkout limit | Defined but **not applied** currently |
| `contactLimiter` | 60 min | 3 | Contact form limit | POST `/api/content/contact` |

### Auth Middleware

| Middleware | File | Purpose |
|-----------|------|---------|
| `authMiddleware` | `middleware/auth.js:17-78` | JWT token verification (header + cookie fallback) |
| `adminMiddleware` | `middleware/auth.js:104-109` | Admin role check (`role === 'admin'`) |
| `permissionMiddleware` | `middleware/auth.js:91-102` | Fine-grained RBAC (exported, not currently applied) |
| `optionalAuth` | `products.routes.js:7-19` | Optional JWT parsing for public routes |
| `validate(schema)` | `middleware/validate.js:3-82` | Schema-based request validation + sanitization |

### File Upload Middleware (Multer)

| Route | Field | Size Limit | Allowed Types | Storage |
|-------|-------|-----------|---------------|---------|
| `POST /api/auth/upload-avatar` | `image` | 5 MB | `image/*` | Memory → Disk/S3 |
| `POST /api/3d/upload` | `modelFile` | 20 MB | `.stl .obj .3mf .stp .step` | Memory → Disk/S3 |
| `POST /api/admin/upload` | `image` | 5 MB | `image/*` | Memory → Disk/S3 |
| `POST /api/store/admin/upload` | `image` | 5 MB | `image/*` | Memory → Disk/S3 |
| `POST /api/store/admin/upload-multiple` | `images` | 5 MB × 10 | `image/*` | Memory → Disk/S3 |

---

## Authentication System

### JWT Access Token
- **Payload:** `{ id, email, role }`
- **Algorithm:** HS256
- **Expiry:** 15 minutes
- **Issuer:** `himalix-api`
- **Audience:** `himalix-frontend`
- **Storage:** HttpOnly cookie (`SameSite=Strict`) + `Authorization: Bearer` header

### Refresh Token
- **Type:** Opaque random token (40-byte hex)
- **Expiry:** 30 days
- **Storage:** SHA-256 hash in `refresh_tokens` DB table
- **Rotation:** New token issued on every use
- **Reuse Detection:** If a revoked token is reused (>10s grace window), ALL user sessions are revoked
- **Cookie:** `SameSite=Lax`, `HttpOnly`, `Path=/`

### Account Security
| Feature | Details |
|---------|---------|
| Password hashing | bcrypt, 12 salt rounds |
| Account lockout | 5 failed attempts → 15min lock |
| IP blocking | 20+ failed logins in 15min → 1hr IP block |
| Token blacklisting | `token_blacklist` table for immediate access token revocation |
| Email verification | 6-digit OTP with 15-minute expiry |
| Registration rate limit | 3 per IP per day |
| Account enumeration prevention | Same response for existing/non-existing emails |

### Google OAuth
- Verifies Google ID token via `google-auth-library` `OAuth2Client`
- Finds/creates user by `google_id` or email
- Downloads Google profile avatar to local storage
- Marks email as verified automatically

---

## API Routes — Complete Reference

### Route Mounting (app.js)

| Mount Path | Module File | Description |
|---|---|---|
| `/api/auth` | `auth/auth.routes.js` | Authentication & user management |
| `/api/content` | `portfolio/portfolio.routes.js` | Public content API |
| `/api/admin` | `admin/portfolio.admin.js` | Admin CMS panel |
| `/api/admin/project` | `admin/projects.admin.js` | Admin projects panel |
| `/api/3d` | `printing/printing.routes.js` | 3D printing service |
| `/api/project` | `projects/projects.routes.js` | Public projects marketplace |
| `/api/support` | `support/support.routes.js` | Support tickets |
| `/api/store/products` | `products/products.routes.js` | Product catalog |
| `/api/store/cart` | `cart/cart.routes.js` | Shopping cart |
| `/api/store/wishlist` | `wishlist/wishlist.routes.js` | Wishlist |
| `/api/store/orders` | `orders/orders.routes.js` | Checkout & orders |
| `/api/store/wallet` | `wallet/wallet.routes.js` | Wallet & referrals |
| `/api/store/reviews` | `reviews/reviews.routes.js` | Product reviews |
| `/api/store/admin` | `admin/store.admin.js` | Admin store panel |
| `/sitemap.xml` | `app.js:90-158` | Dynamic XML sitemap |
| `/robots.txt` | `app.js:161-177` | Dynamic robots.txt |

---

### 1. AUTH MODULE — `/api/auth`

| # | Method | Route | Middleware | Description |
|---|--------|-------|------------|-------------|
| 1 | POST | `/register` | `registerLimiter`, `validate(registerSchema)` | Register new user account |
| 2 | POST | `/login` | `authLimiter`, `validate(loginSchema)` | User login (email/password) |
| 3 | POST | `/verify-email` | `authLimiter`, `validate(verifyEmailSchema)` | Verify email with OTP |
| 4 | POST | `/resend-otp` | `authLimiter`, `validate(resendOtpSchema)` | Resend verification OTP |
| 5 | POST | `/google` | `authLimiter` | Google OAuth login |
| 6 | POST | `/refresh` | — | Refresh JWT access token |
| 7 | POST | `/logout` | — | Logout and invalidate tokens |
| 8 | GET | `/config` | `authLimiter` | Get public site config (Google client ID, etc.) |
| 9 | POST | `/forgot-password` | `authLimiter`, `validate(forgotPasswordSchema)` | Send password reset OTP |
| 10 | POST | `/reset-password` | `authLimiter`, `validate(resetPasswordSchema)` | Reset password with token |
| 11 | GET | `/me` | `authMiddleware` | Get current user profile |
| 12 | PUT | `/update` | `authMiddleware`, `validate(updateProfileSchema)` | Update user profile |
| 13 | PUT | `/password` | `authMiddleware`, `validate(updatePasswordSchema)` | Change password |
| 14 | POST | `/upload-avatar` | `authMiddleware`, `upload.single('image')` | Upload profile avatar |

**Detailed Handler Documentation:**

#### POST `/api/auth/register`
- **Handler:** `authController.register` → `authService.registerUser()`
- **Parameters:** `{ email, password, name, referredByCode }` in body
- **Returns:** `201 { success, needsVerification, email }` with Set-Cookie (token, refreshToken)
- **DB Operations:** IP rate limit check, duplicate email check, referral code lookup, user insert, referral bonus credit (both users)
- **Emails:** Welcome email + OTP verification, admin notification

#### POST `/api/auth/login`
- **Handler:** `authController.login` → `authService.authenticateUser()`
- **Parameters:** `{ email, password }` in body
- **Returns:** `200 { success, user }` with Set-Cookie
- **DB Operations:** Brute-force IP check, user lookup, login attempts tracking, account lockout, refresh token creation
- **Security:** IP blocking after 20 failed attempts, account lockout after 5 failures

#### POST `/api/auth/google`
- **Handler:** `authController.google` → `authService.oauthGoogle()`
- **Parameters:** `{ token }` (Google ID token)
- **Returns:** `200 { success, user }` with Set-Cookie
- **DB Operations:** Google config lookup, user find/create by google_id or email, avatar download

#### POST `/api/auth/refresh`
- **Handler:** `authController.refresh` → `authService.rotateRefreshSession()`
- **Parameters:** Refresh token from cookie
- **Returns:** `200 { success, token }` with new Set-Cookie
- **Security:** Token rotation with reuse detection (10s grace window)

#### POST `/api/auth/logout`
- **Handler:** `authController.logout` → `authService.logoutSession()`
- **Parameters:** Access token from header, refresh token from cookie
- **Returns:** `200 { success, message }` with cleared cookies
- **DB Operations:** Blacklist access token, revoke refresh token

#### GET `/api/auth/me`
- **Handler:** `authController.getMe` → `authService.getUserWithBalance()`
- **Returns:** `200 { success, user }` with wallet_balance, addresses array

#### PUT `/api/auth/update`
- **Handler:** `authController.updateProfile` → `authService.updateProfile()`
- **Parameters:** `{ name, phone, shipping_address, avatar_url }`
- **DB Operations:** Profile update, address upsert into `user_addresses`

#### PUT `/api/auth/password`
- **Handler:** `authController.updatePassword` → `authService.updatePassword()`
- **Parameters:** `{ currentPassword, newPassword }`
- **Security:** Revokes ALL refresh tokens on success (force re-auth on all devices)

#### POST `/api/auth/upload-avatar`
- **Handler:** `authController.uploadAvatar`
- **File:** Multer single image (5MB, `image/*`)
- **Storage:** `uploads/avatars/` subfolder

#### POST `/api/auth/verify-email`
- **Handler:** `authController.verifyEmail` → `authService.verifyEmailOtp()`
- **Parameters:** `{ email, otp }`
- **Returns:** `200 { success, token, user }` with Set-Cookie

#### POST `/api/auth/resend-otp`
- **Handler:** `authController.resendOtp` → `authService.resendVerificationOtp()`
- **Parameters:** `{ email }`
- **Security:** 1-minute cooldown between OTPs

#### GET `/api/auth/config`
- **Returns:** Public site settings (Google client ID, tax rate, site logo, form designs)
- **Security:** Returns redacted values for non-browser requests

#### POST `/api/auth/forgot-password`
- **Parameters:** `{ email }`
- **Returns:** `200 { success, message }` (same response whether email exists or not)

#### POST `/api/auth/reset-password`
- **Parameters:** `{ token, password }`
- **Security:** Validates token + 1hr expiry, revokes all sessions

---

### 2. PORTFOLIO / CONTENT MODULE — `/api/content`

| # | Method | Route | Middleware | Description |
|---|--------|-------|------------|-------------|
| 1 | GET | `/` | — | Fetch all landing page content (services, team, testimonials, settings) |
| 2 | GET | `/section/:section` | — | Fetch content for a specific section |
| 3 | POST | `/contact` | `contactLimiter` | Submit contact form message |
| 4 | GET | `/search` | — | Universal search (products + projects) |
| 5 | GET | `/team/:endpoint` | — | Fetch single team member by URL slug |

---

### 3. ADMIN PORTFOLIO / CMS — `/api/admin`

**Global Middleware:** `authMiddleware` + `adminMiddleware`

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 1 | POST | `/upload` | Upload image (legacy fallback) |
| 2 | POST | `/upload/projects/upload` | Upload project image |
| 3 | POST | `/upload/portfolio/upload` | Upload portfolio asset |
| 4 | GET | `/content` | Get all CMS content |
| 5 | PUT | `/content/:section` | Update CMS section |
| 6 | PUT | `/content/id/:id` | Update individual content item |
| 7 | PUT | `/content/bulk` | Bulk update content items |
| 8 | GET | `/services` | List all services |
| 9 | POST | `/services` | Create service |
| 10 | PUT | `/services/:id` | Update service |
| 11 | DELETE | `/services/:id` | Delete service |
| 12 | GET | `/team` | List all team members |
| 13 | POST | `/team` | Create team member |
| 14 | PUT | `/team/:id` | Update team member |
| 15 | DELETE | `/team/:id` | Delete team member |
| 16 | GET | `/testimonials` | List all testimonials |
| 17 | POST | `/testimonials` | Create testimonial |
| 18 | PUT | `/testimonials/:id` | Update testimonial |
| 19 | DELETE | `/testimonials/:id` | Delete testimonial |
| 20 | GET | `/settings` | Get all site settings |
| 21 | PUT | `/settings/:key` | Update site setting by key |
| 22 | GET | `/messages` | List all contact messages |
| 23 | PUT | `/messages/:id/read` | Mark message as read |
| 24 | DELETE | `/messages/:id` | Delete contact message |
| 25 | GET | `/stats` | Get CMS dashboard stats |
| 26 | POST | `/smtp/test` | Test SMTP credentials |
| 27 | PUT | `/services/reorder` | Reorder services |
| 28 | PUT | `/team/reorder` | Reorder team members |
| 29 | PUT | `/testimonials/reorder` | Reorder testimonials |
| 30 | GET | `/db/tables` | List all DB tables |
| 31 | GET | `/db/table/:name` | Get table columns and rows |
| 32 | POST | `/db/table/:name` | Insert row into table |
| 33 | PUT | `/db/table/:name/:id` | Update row in table |
| 34 | DELETE | `/db/table/:name/:id` | Delete row from table |
| 35 | POST | `/batch-delete` | Batch delete (services, team, testimonials) |
| 36 | POST | `/batch-toggle-active` | Batch toggle active state |

---

### 4. ADMIN PROJECTS — `/api/admin/project`

**Global Middleware:** `authMiddleware` + `adminMiddleware`

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 1 | GET | `/` | List all projects (admin view) |
| 2 | POST | `/` | Create project |
| 3 | PUT | `/:id` | Update project |
| 4 | DELETE | `/:id` | Delete project |
| 5 | GET | `/:id/components` | Get project components |
| 6 | POST | `/:id/components` | Link component to project |
| 7 | DELETE | `/:id/components/:linkId` | Remove component link |
| 8 | GET | `/orders` | Get all project orders |
| 9 | PUT | `/orders/:id/status` | Update project order status |
| 10 | DELETE | `/orders/:id` | Delete project order |
| 11 | GET | `/notifications/receivers` | Get notification receivers |
| 12 | POST | `/notifications/receivers` | Add notification receiver |
| 13 | PUT | `/notifications/receivers/:id` | Update notification receiver |
| 14 | DELETE | `/notifications/receivers/:id` | Delete notification receiver |
| 15 | GET | `/custom-requests` | Get all custom project requests |
| 16 | PUT | `/custom-requests/:id/status` | Update custom request status |
| 17 | DELETE | `/custom-requests/:id` | Delete custom project request |
| 18 | POST | `/batch-delete` | Batch delete projects/custom requests |
| 19 | POST | `/batch-status` | Batch update status |
| 20 | POST | `/batch-toggle-active` | Batch toggle active state |
| 21 | GET | `/:id/blocked` | Get blocked dates for project |
| 22 | POST | `/:id/blocked` | Add blocked date range |
| 23 | DELETE | `/:id/blocked/:blockedId` | Remove blocked date range |

---

### 5. ADMIN STORE — `/api/store/admin`

**Global Middleware:** `authMiddleware` + `adminMiddleware`

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 1 | POST | `/upload` | Upload single image |
| 2 | POST | `/upload-multiple` | Upload multiple images (max 10) |
| 3 | GET | `/analytics` | Get store analytics dashboard |
| 4 | GET | `/products` | List all products |
| 5 | POST | `/products` | Create product |
| 6 | PUT | `/products/:id` | Update product |
| 7 | DELETE | `/products/:id` | Soft delete product |
| 8 | GET | `/users` | List all users |
| 9 | GET | `/users/:id/details` | Get user full details |
| 10 | PUT | `/users/:id` | Update user (email/role) |
| 11 | PUT | `/users/:id/password` | Admin reset user password |
| 12 | PUT | `/users/:id/role` | Change user role |
| 13 | GET | `/users/:id/orders` | Get user's orders |
| 14 | DELETE | `/users/:id` | Soft delete user |
| 15 | GET | `/carts` | View all cart audits |
| 16 | GET | `/orders` | List all orders |
| 17 | PUT | `/orders/:id/status` | Update order status/tracking |
| 18 | DELETE | `/orders/:id` | Soft delete order |
| 19 | GET | `/settings` | Get named store settings |
| 20 | PUT | `/settings` | Update store settings |
| 21 | GET | `/settings/raw` | Get raw key/value settings |
| 22 | POST | `/settings/raw` | Upsert raw setting |
| 23 | DELETE | `/settings/raw/:key` | Delete raw setting |
| 24 | POST | `/users/:id/credit` | Manual wallet credit deposit |
| 25 | GET | `/reviews` | List all reviews |
| 26 | DELETE | `/reviews/:id` | Soft delete review |
| 27 | GET | `/wallet/transactions` | List all wallet transactions |
| 28 | GET | `/social-claims` | List all social follow claims |
| 29 | GET | `/notification-receivers` | List notification receivers |
| 30 | POST | `/notification-receivers` | Add notification receiver |
| 31 | PUT | `/notification-receivers/:id` | Update notification receiver |
| 32 | DELETE | `/notification-receivers/:id` | Delete notification receiver |
| 33 | GET | `/logs` | Combined transaction logs |
| 34 | GET | `/printing` | List all 3D print orders |
| 35 | PUT | `/printing/:id` | Update 3D print order status/price |
| 36 | GET | `/support-tickets` | List all support tickets |
| 37 | GET | `/support-tickets/:id/messages` | Get ticket messages |
| 38 | POST | `/support-tickets/:id/reply` | Admin reply to ticket |
| 39 | PUT | `/support-tickets/:id/status` | Update ticket status |
| 40 | GET | `/web-inquiries/:id/messages` | Get CRM messages |
| 41 | POST | `/web-inquiries/:id/messages` | Send CRM message |
| 42 | GET | `/web-inquiries/:id/revisions` | Get revision requests |
| 43 | PUT | `/web-inquiries/revisions/:revId` | Update revision status |
| 44 | GET | `/coupons` | List all coupons |
| 45 | POST | `/coupons` | Create coupon |
| 46 | PUT | `/coupons/:id` | Update coupon |
| 47 | DELETE | `/coupons/:id` | Delete coupon |
| 48 | GET | `/database/backup` | SQL dump backup export |
| 49 | GET | `/command-center` | Command center dashboard data |
| 50 | GET | `/notifications` | Latest 15 application logs |
| 51 | GET | `/activity-logs` | Paginated activity logs |
| 52 | POST | `/batch-delete` | Batch delete (users/products/orders/reviews/coupons/printing/support) |
| 53 | POST | `/batch-status` | Batch status update (orders/printing/support) |
| 54 | POST | `/batch-toggle-active` | Batch toggle active (products/coupons) |
| 55 | POST | `/batch-role` | Batch update user roles |

---

### 6. 3D PRINTING — `/api/3d`

**Global Middleware:** `authMiddleware`

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 1 | GET | `/` | Get user's 3D print orders |
| 2 | POST | `/upload` | Upload 3D model file only |
| 3 | POST | `/` | Place 3D printing order (with optional file) |
| 4 | POST | `/checkout/:id` | Approve quotation & pay with wallet |

**3D Print Order Workflow:**
1. User uploads 3D model (STL/OBJ/3MF/STP/STEP)
2. User configures material, color, infill, layer height, quantity
3. Order created with `pending_review` status
4. Admin reviews and sets price → status changes to `estimated`
5. User approves and pays from wallet → status changes to `approved`
6. Admin prints → `printing` → `completed`

---

### 7. PRODUCTS — `/api/store/products`

| # | Method | Route | Middleware | Description |
|---|--------|-------|------------|-------------|
| 1 | GET | `/` | `optionalAuth` | List products (search, filter, sort, paginated) |
| 2 | GET | `/:id` | `optionalAuth` | Get single product (by ID or slug) |

---

### 8. CART — `/api/store/cart`

**Global Middleware:** `authMiddleware`

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 1 | GET | `/` | Get user's cart items |
| 2 | POST | `/` | Add item to cart |
| 3 | POST | `/add` | Add item to cart (alias) |
| 4 | PUT | `/update` | Update cart item quantity |
| 5 | PUT | `/:productId` | Update cart item (by product ID) |
| 6 | DELETE | `/remove/:id` | Remove cart item by cart ID |
| 7 | DELETE | `/:productId` | Remove cart item by product ID |
| 8 | DELETE | `/` | Clear entire cart |
| 9 | POST | `/sync` | Batch sync guest cart on login |

**Cart Item Types:**
- Standard product (product_id)
- Project (project_id, is_project=true)
- 3D custom print (is_3d=true, custom_responses)

---

### 9. WISHLIST — `/api/store/wishlist`

**Global Middleware:** `authMiddleware`

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 1 | GET | `/` | Get user's wishlist |
| 2 | POST | `/` | Add product to wishlist |
| 3 | DELETE | `/:productId` | Remove product from wishlist |

---

### 10. ORDERS — `/api/store/orders`

| # | Method | Route | Middleware | Description |
|---|--------|-------|------------|-------------|
| 1 | GET | `/track/:code` | — (public) | Track order by tracking code |
| 2 | GET | `/ip-location` | `authMiddleware` | Get user's IP geolocation |
| 3 | POST | `/checkout` | `authMiddleware` | Place store order |
| 4 | POST | `/` | `authMiddleware` | Place store order (alias) |
| 5 | GET | `/history` | `authMiddleware` | Get user's order history |
| 6 | GET | `/my` | `authMiddleware` | Get user's orders (alias) |
| 7 | GET | `/shipping` | `authMiddleware` | Calculate shipping cost by distance |
| 8 | POST | `/apply-coupon` | `authMiddleware` | Validate & apply coupon code |

**Checkout Flow:**
1. Validate cart items
2. Lock stock with `FOR UPDATE`
3. Prevent double-booking of rental projects
4. Calculate Haversine-based shipping fee
5. Apply coupons (with usage/per-user limits)
6. Handle wallet (store_credit) payment
7. Generate tracking code (`HMX-XXXXXX-XXXXXX`)
8. Create order + items
9. Deduct stock
10. Save checkout address as default
11. Clear cart
12. Send admin notification + customer confirmation emails

---

### 11. REVIEWS — `/api/store/reviews`

| # | Method | Route | Middleware | Description |
|---|--------|-------|------------|-------------|
| 1 | GET | `/:product_id` | — | Get reviews for a product |
| 2 | POST | `/:product_id` | `authMiddleware` | Submit product review |
| 3 | PUT | `/review/:id` | `authMiddleware` | Edit own review |
| 4 | DELETE | `/review/:id` | `authMiddleware` | Delete own review |

**Review Rules:**
- Valid rating: 1-5
- One review per user per product
- Must have delivered/completed order for the product
- Only owner can edit/delete

---

### 12. SUPPORT — `/api/support`

**Global Middleware:** `authMiddleware`

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 1 | GET | `/` | List user's support tickets |
| 2 | GET | `/:id` | Get ticket with messages |
| 3 | POST | `/` | Create support ticket |
| 4 | POST | `/:id/reply` | Reply to ticket |
| 5 | PUT | `/:id/close` | Close ticket |

---

### 13. WALLET — `/api/store/wallet`

**Global Middleware:** `authMiddleware`

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 1 | GET | `/` | Get wallet balance & stats |
| 2 | GET | `/history` | Get wallet transaction history |
| 3 | POST | `/referral` | Bind referral code & earn bonus |
| 4 | POST | `/claim-social` | Claim social media follow reward |
| 5 | POST | `/social-claim` | Claim social media reward (alias) |

**Wallet Transaction Types:**
- `deposit` — Manual deposit
- `purchase` — Order payment deduction
- `refund` — Order cancellation refund
- `referral_bonus` — Referrer reward
- `signup_bonus` — New user referral reward
- `social_reward` — Social media follow reward
- `admin_adjustment` — Admin manual adjustment

**Social Platforms:**
- YouTube (configurable reward)
- Instagram (configurable reward)
- Facebook (configurable reward)

---

### 14. PROJECTS — `/api/project`

| # | Method | Route | Middleware | Description |
|---|--------|-------|------------|-------------|
| 1 | GET | `/` | — | List active projects (search/filter/sort) |
| 2 | GET | `/orders/my` | `authMiddleware` | Get user's project orders |
| 3 | GET | `/:id` | — | Get single project with components |
| 4 | GET | `/:id/availability` | — | Get booked/blocked dates for project |
| 5 | POST | `/:id/order` | `authMiddleware` | Place order/rental for project |
| 6 | POST | `/custom-request` | — | Submit custom project request |

**Project Order Types:**
- `buy` — Purchase project (checks stock)
- `rent` — Rent project (validates dates, checks double-booking, calculates duration-based price)

**Rental Pricing:**
- Weekly rate from project price
- Duration-based calculation: `(price / 7) * days`
- Deposit: `price * 1.5`

---

### 15. APP-LEVEL ROUTES

| # | Method | Route | Description |
|---|--------|-------|-------------|
| 1 | GET | `/sitemap.xml` | Generate XML sitemap for SEO |
| 2 | GET | `/robots.txt` | Serve robots.txt with crawl directives |

---

## Services Layer

### 1. Storage Service (`services/storage.js`)
- **Purpose:** Unified file upload — AWS S3/Cloudflare R2 with local disk fallback
- **Method:** `uploadFile(file, subfolder)`
- **Naming:** `{Date.now()}-{random8hex}.{ext}`
- **Subfolders:** `avatars/`, `products/`, `projects/`, `portfolio/`, `3d/`
- **Cloud:** Dynamically loads `@aws-sdk/client-s3` if env vars present

### 2. Audit Service (`services/audit.js`)
- **Purpose:** Tamper-evident audit trail with hash chaining + security alerting
- **Methods:** `logAuditEvent()`, `logSecurityEvent()`
- **Hash Chain:** SHA-256 of `userId|email|action|resourceType|resourceId|previousHash|timestamp`
- **Security Alerts:** Sends email to all receivers subscribed to `notify_on_security_alert`

### 3. App Logger Service (`services/appLogger.js`)
- **Purpose:** Fire-and-forget activity logging
- **Method:** `logActivity(req, { action, entityType, entityId, summary, metadata })`
- **Storage:** `application_logs` table

### 4. Mail Service (`config/mail.js`)
- **Purpose:** SMTP email sending with background queue and styled templates
- **Methods:** `sendEmail()`, `sendNotificationEmail()`, `sendContactForwardEmail()`, `sendProjectOrderEmail()`, `sendProjectStatusChangeEmail()`
- **Queue:** Asynchronous via `EventEmitter` + `setImmediate()`
- **Templates:** Dark theme HTML with gold accents, Himalix branding

### 5. Auth Service (`modules/auth/auth.service.js`)
- **Purpose:** Complete auth lifecycle — registration, login, OAuth, sessions, profile, password reset
- **Methods (17):** `registerUser`, `authenticateUser`, `oauthGoogle`, `rotateRefreshSession`, `logoutSession`, `getUserWithBalance`, `updateProfile`, `updatePassword`, `updateAvatar`, `verifyEmailOtp`, `resendVerificationOtp`, `forgotPassword`, `resetPassword`, plus internal helpers

---

## Database Schema

### 34 Tables by Domain

| Domain | Tables |
|--------|--------|
| **Users & Auth** | `users`, `refresh_tokens`, `token_blacklist`, `blocked_ips` |
| **E-Commerce** | `products`, `orders`, `order_items`, `order_status_history`, `cart_items`, `wishlist_items`, `reviews`, `coupons`, `coupon_usage` |
| **Projects** | `projects`, `project_components`, `project_blocked_dates`, `project_orders`, `custom_project_requests` |
| **3D Printing** | `printing_orders` |
| **Wallet** | `wallet_transactions`, `social_claims` |
| **CMS** | `landing_content`, `services`, `team_members`, `testimonials`, `site_settings`, `contact_messages` |
| **Support** | `support_tickets`, `support_ticket_messages` |
| **Logging** | `audit_logs`, `security_events`, `application_logs` |
| **Addresses** | `user_addresses` |
| **Notifications** | `notification_receivers` |

### Key Schema Features
- **Soft deletes** on `users`, `products`, `orders`, `reviews`
- **JSON-validated columns** via `CHECK (json_valid(...))`
- **Fulltext search** on `products` (`name`, `description`)
- **Hash-chained audit logs** — each entry's SHA-256 hash includes the previous entry's hash
- **InnoDB engine** on all tables (transaction support)
- **utf8mb4 charset** (full Unicode support including emoji)

---

## File Upload System

| Operation | Route | Subfolder | Size Limit | Allowed Types |
|-----------|-------|-----------|-----------|---------------|
| Avatar upload | `POST /api/auth/upload-avatar` | `avatars/` | 5 MB | `image/*` |
| Google avatar download | OAuth flow | root `uploads/` | Unlimited | JPEG only |
| Product single image | `POST /api/store/admin/upload` | `products/` | 5 MB | `image/*` |
| Product multi images | `POST /api/store/admin/upload-multiple` | `products/` | 5 MB × 10 | `image/*` |
| Portfolio image | `POST /api/admin/upload` | `portfolio/` | 5 MB | `image/*` |
| Project image | `POST /api/admin/upload/projects/upload` | `projects/` | 5 MB | `image/*` |
| 3D model upload | `POST /api/3d/upload` | `3d/` | 20 MB | `.stl .obj .3mf .stp .step` |
| 3D order + file | `POST /api/3d/` | `3d/` | 20 MB | `.stl .obj .3mf .stp .step` |
| DB backup download | `GET /api/store/admin/database/backup` | N/A (streamed) | N/A | `.sql` |

**Storage Flow:** Multer `memoryStorage()` → buffer in RAM → `storage.js:uploadFile()` → S3/R2 (if configured) or local disk

---

## Email System

### Email Types

| Event | Recipients | Template |
|-------|-----------|----------|
| User registration | New user | Welcome + OTP verification |
| Admin notification | `notification_receivers` with `notify_on_user_registered` | New account alert |
| Email verified | User | Welcome + account details |
| Forgot password | User | Reset link |
| Order placed | Customer + admin | Order confirmation |
| Low stock | `notification_receivers` with `notify_on_low_stock` | Stock alert |
| Security alert | `notification_receivers` with `notify_on_security_alert` | Critical security event |
| Project order | `notification_receivers` with `notify_on_project_order` | Project order alert |
| Project status change | Buyer + admin | Status update |
| Contact message | `notification_receivers` with `notify_on_contact_message` | Contact form forward |
| 3D printing order | `notification_receivers` with `notify_on_printing_order` | Print quote request |

### Notification Receiver Configuration
Each receiver has per-event toggles:
- `notify_on_order`
- `notify_on_low_stock`
- `notify_on_user_registered`
- `notify_on_security_alert`
- `notify_on_project_order`
- `notify_on_contact_message`
- `notify_on_printing_order`

---

## Security Measures

### Headers (Helmet)
- Content Security Policy (CSP)
- Strict Transport Security (HSTS) — 1 year, includeSubDomains, preload
- X-XSS-Protection
- X-Content-Type-Options (nosniff)
- Referrer-Policy (strict-origin-when-cross-origin)
- Cross-Origin-Resource-Policy (cross-origin)

### Authentication Security
- JWT with 15-minute expiry + rotating refresh tokens (30 days)
- Token blacklisting on logout
- Refresh token reuse detection with 10-second grace window
- bcrypt password hashing (12 salt rounds)
- Account lockout (5 failed attempts → 15min)
- IP blocking (20+ failed logins → 1hr block)
- Email verification with OTP

### Input Security
- Schema-based validation with field stripping
- Parameterized queries (no SQL injection)
- HTML entity encoding (XSS prevention)
- Filename sanitization (path traversal prevention)
- MIME type validation
- File size limits

### Data Security
- Soft deletes (data preservation)
- Hash-chained audit logs (tamper-evident)
- Password redaction in admin views
- SMTP/Google secret masking in API responses
- CORS single-origin restriction
- Direct IP access blocking

---

## Admin Panel

### Admin Views (18 total)

| Group | View | Description |
|-------|------|-------------|
| Overview | Dashboard | Analytics overview with charts |
| Orders & Requests | All Orders (UnifiedOrders) | All order types in one table |
| Catalog | Store Products (ProductCatalog) | CRUD product management |
| Catalog | Project Catalog (ProjectManager) | CRUD project management |
| Catalog | Custom Requests (CustomProjectRequests) | Custom project request handling |
| Communications | Inbox & Support (CommunicationsHub) | Inbox + support ticket management |
| Customers | User Accounts (UserManager) | User account management |
| Customers | Product Reviews (ReviewManager) | Review moderation |
| Website CMS | Hero & About (HeroContentEditor) | CMS hero/about section editor |
| Website CMS | Team Members (CrudSection) | Generic CRUD for team |
| Website CMS | Testimonials (CrudSection) | Generic CRUD for testimonials |
| Settings | System Config (SettingsManager) | System-wide configuration |
| Settings | 3D Print Config (PrintFormDesigner) | 3D printing form configurator |
| Settings | Coupon Codes (CouponManager) | Coupon code CRUD |
| Settings | Email Alerts (StoreEmailReceivers) | Email notification config |
| Settings | Project Alerts (ProjectNotifications) | Project alert config |
| System | Activity Logs (LogsManager) | Activity audit logs |
| System | Database Manager (DatabaseManager) | Database maintenance tools |

### Batch Operations
- Batch delete (multiple entity types)
- Batch status update (orders, printing, support)
- Batch toggle active (products, coupons)
- Batch role update (users)

---

## Scripts & Migrations

| Script | Purpose |
|--------|---------|
| `scripts/sync_wallet_balances.js` | Syncs `wallet_balance` column with `wallet_transactions` sum |
| `scripts/migrate_uploads.js` | Moves flat upload files to organized subdirectories |
| `scripts/export_schema.js` | Exports live DB schema to SQL file |
| `scripts/ecommerce_fixes_migration.js` | Adds rental columns to `project_orders`, `stock_quantity` to `projects` |
| `scripts/alter_stock_type.js` | Modifies `products.stock_type` enum to include `out_of_stock` |
| `scripts/add_wallet_balance_column.js` | Adds `wallet_balance` column to `users` and syncs balances |

---

## Total Route Count: **175 routes**

| Module | Count |
|--------|-------|
| Auth | 14 |
| Portfolio/Content | 5 |
| Admin Portfolio/CMS | 36 |
| Admin Projects | 23 |
| Admin Store | 55 |
| 3D Printing | 4 |
| Products | 2 |
| Cart | 9 |
| Wishlist | 3 |
| Orders | 8 |
| Reviews | 4 |
| Support | 5 |
| Wallet | 5 |
| Projects | 6 |
| App-level | 2 |
| **TOTAL** | **175** |
