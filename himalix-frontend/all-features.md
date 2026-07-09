# Himalix Labs Unified Platform — Exhaustive Feature Documentation

> Complete A-Z documentation of every working system, feature, and capability in the Himalix Labs platform. Focus is on functional systems and business logic, not UI aesthetics.

---

## Table of Contents

1. [Authentication & Session Management](#1-authentication--session-management)
2. [User Profile Management](#2-user-profile-management)
3. [E-Commerce: Product Catalog](#3-e-commerce-product-catalog)
4. [E-Commerce: Shopping Cart](#4-e-commerce-shopping-cart)
5. [E-Commerce: Checkout & Orders](#5-e-commerce-checkout--orders)
6. [E-Commerce: Coupons & Discounts](#6-e-commerce-coupons--discounts)
7. [E-Commerce: Wishlist](#7-e-commerce-wishlist)
8. [E-Commerce: Reviews & Ratings](#8-e-commerce-reviews--ratings)
9. [Wallet System](#9-wallet-system)
10. [Engineering Projects Marketplace](#10-engineering-projects-marketplace)
11. [3D Printing Service](#11-3d-printing-service)
12. [Support Ticket System](#12-support-ticket-system)
13. [Portfolio CMS](#13-portfolio-cms)
14. [Admin Panel](#14-admin-panel)
15. [File Upload System](#15-file-upload-system)
16. [Email System](#16-email-system)
17. [Audit Logging & Security](#17-audit-logging--security)
18. [Internationalization (i18n)](#18-internationalization-i18n)
19. [Theme System (Dark/Light Mode)](#19-theme-system-darklight-mode)
20. [SEO System](#20-seo-system)
21. [Search System](#21-search-system)
22. [Rate Limiting](#22-rate-limiting)
23. [Database Migrations](#23-database-migrations)
24. [Deployment & Configuration](#24-deployment--configuration)
25. [API Reference Quick Index](#25-api-reference-quick-index)

---

## 1. Authentication & Session Management

### 1.1 Registration System
- **Endpoint**: `POST /api/auth/register`
- **Fields**: `name`, `email`, `password`, `phone` (optional), `referralCode` (optional)
- **Validation**: Email format, password strength (min 6 chars), name required
- **Rate Limit**: 5 registrations per 15 minutes per IP
- **Duplicate Check**: Prevents duplicate emails
- **Password Hashing**: bcrypt with 12 salt rounds
- **OTP Generation**: 6-digit numeric OTP, SHA-256 hashed before storage
- **OTP Expiry**: 15 minutes
- **Referral System**: If valid `referralCode` provided, creates `social_claims` entry with `platform='referral'`
- **Audit Logging**: Hash-chained entry on registration success
- **Security Events**: Logged with IP, correlation ID

### 1.2 Login System
- **Endpoint**: `POST /api/auth/login`
- **Fields**: `email`, `password`
- **Rate Limit**: 15 login attempts per 15 minutes per IP
- **Account Lockout**: 5 consecutive failed attempts = 15-minute lock (`lockedUntil`)
- **Brute Force Protection**: 20 failed logins from same IP = 1-hour IP block (`blocked_ips` table)
- **Email Verification Check**: Blocks login if `email_verified=0` (except admin accounts)
- **JWT Generation**: Access token (15-minute expiry) with `id`, `email`, `role`, `iss`, `aud`
- **Refresh Token**: 80-character hex string, SHA-256 hashed in DB, 30-day expiry
- **Token Rotation**: On refresh, old token revoked with `replaced_by` link
- **Reuse Detection**: If stolen refresh token used, ALL user sessions revoked
- **Grace Window**: 10-second tolerance for parallel browser requests
- **Audit Logging**: Hash-chained entry on success/failure

### 1.3 Google OAuth
- **Endpoint**: `POST /api/auth/google`
- **Flow**: Frontend gets Google ID token → Backend verifies with `google-auth-library`
- **New User**: Creates account with `google_id`, `email_verified=1`, random 16-char password
- **Existing User**: Links Google ID if not already linked
- **Same Email**: If email exists (password account), merges Google ID
- **Same Google ID**: Prevents duplicate Google accounts

### 1.4 Email Verification
- **Endpoint**: `POST /api/auth/verify-email`
- **Fields**: `email`, `otp` (6-digit)
- **Verification**: Compares SHA-256 hash of provided OTP against stored hash
- **Expiry Check**: OTP expires after 15 minutes
- **Auto-Login**: Returns JWT tokens on successful verification
- **Resend Endpoint**: `POST /api/auth/resend-otp` (1-minute cooldown between resends)
- **Account Enumeration Prevention**: Returns same message whether email exists or not

### 1.5 Token Refresh
- **Endpoint**: `POST /api/auth/refresh`
- **Token Rotation**: Generates new access + refresh tokens
- **Old Token Revocation**: Sets `replaced_by` on old refresh token
- **Reuse Detection**: If token already revoked (stolen), revokes ALL user refresh tokens
- **Grace Window**: 10-second tolerance for parallel requests
- **Token Cleanup**: Deletes expired tokens on each refresh call

### 1.6 Logout
- **Endpoint**: `POST /api/auth/logout`
- **Token Blacklisting**: Adds token SHA-256 hash to `token_blacklist` with expiry
- **Refresh Token Revocation**: Sets `revoked=true` on refresh token
- **Audit Logging**: Hash-chained entry on logout

### 1.7 Password Reset
- **Request Endpoint**: `POST /api/auth/forgot-password`
  - Rate limited: 5 requests per 15 minutes per IP
  - Account enumeration prevention: Same response whether email exists
  - Generates 32-byte hex token, SHA-256 hashed for DB storage
  - 1-hour token expiry
  - Sends password reset email via SMTP

- **Reset Endpoint**: `POST /api/auth/reset-password`
  - Fields: `token`, `password`
  - Validates token hash against DB
  - Checks expiry
  - Updates password
  - Revokes ALL refresh tokens (force sign-out)
  - Audit logging

### 1.8 Password Change
- **Endpoint**: `PUT /api/auth/password`
- **Fields**: `currentPassword`, `newPassword`
- **Current Password Verification**: Must match before change
- **Force Sign-out**: Revokes ALL refresh tokens after change
- **Audit Logging**: Hash-chained entry

### 1.9 Middleware Authentication
- **`authenticateToken`**: Extracts Bearer token, verifies JWT, checks blacklist, attaches `req.user`
- **`requireAdmin`**: Checks `req.user.role === 'admin'` after authentication
- **`optionalAuth`**: Attaches user if token present, continues if not (for public routes with optional user context)

---

## 2. User Profile Management

### 2.1 Get Profile
- **Endpoint**: `GET /api/auth/me`
- **Returns**: User data (id, name, email, phone, role, wallet_balance, avatar_url, addresses) + wallet balance
- **Joins**: `users` with `wallet_transactions` for balance calculation

### 2.2 Update Profile
- **Endpoint**: `PUT /api/auth/update`
- **Fields**: `name`, `phone`, `address` (object with street, city, state, zipCode, country)
- **Address Handling**: Creates or updates default address in `user_addresses` table
- **Audit Logging**: Hash-chained entry

### 2.3 Avatar Upload
- **Endpoint**: `POST /api/auth/upload-avatar`
- **File Limit**: 5MB
- **Accepted Types**: JPEG, PNG, GIF
- **Storage**: S3/R2 (cloud) or local `uploads/avatars/` (fallback)
- **Filename**: `{userId}_{timestamp}.{ext}`
- **Old Avatar Cleanup**: Deletes previous avatar on upload

### 2.4 User Addresses
- **Multi-Address Support**: Users can have multiple addresses
- **Default Address**: One address marked as default
- **Fields**: street, city, state, zipCode, country, latitude, longitude
- **Location Picker**: Leaflet map integration for coordinate selection
- **Auto-Save**: Default address auto-updated on checkout

---

## 3. E-Commerce: Product Catalog

### 3.1 Product Listing
- **Endpoint**: `GET /api/store/products`
- **Features**:
  - Fulltext search on `name` and `description` (MySQL FULLTEXT)
  - Category filtering
  - Price range filtering
  - Stock filtering (in-stock, out-of-stock)
  - Sort: price-asc, price-desc, newest, name-asc, name-desc
  - Pagination with total count
  - Returns `hasMore` flag for infinite scroll

### 3.2 Product Detail
- **Endpoint**: `GET /api/store/products/:id`
- **Accepts**: Product ID or slug
- **Returns**: Full product data including:
  - Basic info (name, description, price, sale_price)
  - Categories and tags (JSON parsed)
  - Technical specifications (JSON parsed)
  - Features list (JSON parsed)
  - Image URLs (JSON parsed)
  - Stock status and quantity
  - Average rating and review count
  - Related products (same category)
  - SEO metadata

### 3.3 Product Schema
- **Fields**:
  - `id`, `name`, `slug` (auto-generated, unique)
  - `description`, `short_description`
  - `price`, `sale_price` (nullable)
  - `category`, `tags` (JSON array)
  - `technical_specs` (JSON object, validated)
  - `features` (JSON array, validated)
  - `image_urls` (JSON array, validated)
  - `stock_quantity`, `stock_type` ('in_stock', 'out_of_stock', 'pre_order')
  - `is_active` (boolean, soft delete alternative)
  - `deleted_at` (soft delete timestamp)
  - `created_at`, `updated_at`

---

## 4. E-Commerce: Shopping Cart

### 4.1 Cart Operations
- **Get Cart**: `GET /api/store/cart` — Returns all cart items with product details
- **Add to Cart**: `POST /api/store/cart` — Adds product or project to cart
  - Validates product exists and is active
  - Checks stock availability
  - For projects: Checks rental availability for specified dates
  - Prevents duplicate items (updates quantity instead)
- **Update Quantity**: `PUT /api/store/cart/update` — Updates item quantity
  - Validates stock for new quantity
- **Remove Item**: `DELETE /api/store/cart/remove/:id` — Removes single item
- **Clear Cart**: `DELETE /api/store/cart` — Empties entire cart

### 4.2 Guest Cart Sync
- **Endpoint**: `POST /api/store/cart/sync`
- **Flow**: Guest carts stored in localStorage → On login, syncs to server
- **Merge Strategy**: Adds guest items to existing cart, updates quantities if duplicate

### 4.3 Cart Context (Frontend)
- **State**: `items` array with product/project details
- **Persistence**: Server-side for authenticated users, localStorage for guests
- **Operations**: `addToCart`, `updateQuantity`, `removeFromCart`, `clearCart`, `syncGuestCart`
- **Badge Count**: Navbar shows cart item count

---

## 5. E-Commerce: Checkout & Orders

### 5.1 Checkout Flow
- **Endpoint**: `POST /api/store/orders/checkout`
- **Step-by-Step Process**:
  1. **Cart Loading**: Fetch all cart items with product/project details
  2. **Stock Verification**: Pessimistic `FOR UPDATE` row locks on products
  3. **Double-Booking Check**: For rental projects, checks overlap in both `project_orders` and unified `orders` tables
  4. **Subtotal Calculation**: Sum of price × quantity
  5. **Tax Calculation**: Configurable sales tax rate (default 13% VAT Nepal)
  6. **Shipping Calculation**: Haversine distance from HQ (27.7029°N, 85.3072°E), free over threshold
  7. **Coupon Application**: Fixed or percentage discount with usage limits
  8. **Wallet Deduction**: If `store_credit`, verifies sufficient balance
  9. **Tracking Code**: Format `HMX-{timestamp}-{random}`
  10. **Order Creation**: Transactional insert with line items
  11. **Stock Adjustment**: Decrement inventory, manage rental status
  12. **Address Auto-Save**: Update or create default user address
  13. **Post-Commit**: Email confirmation, admin notification, low-stock alerts

### 5.2 Payment Methods
- **Cash on Delivery**: Order created as `unpaid`, pays on delivery
- **Store Credit**: Deducts from wallet balance, immediate `paid` status, refundable on cancellation

### 5.3 Shipping Calculation
- **Algorithm**: Haversine great-circle distance from Kathmandu HQ
- **Configurable**: Per-km rate, minimum charge, free shipping threshold
- **ETA**: Distance-based (1-3 days)
- **Endpoint**: `GET /api/store/orders/shipping` — Calculates shipping for cart

### 5.4 Order Tracking
- **Endpoint**: `GET /api/store/orders/track/:code`
- **Public**: No authentication required
- **Returns**: Order status, items, timeline, estimated delivery

### 5.5 Order History
- **Endpoint**: `GET /api/store/orders/history`
- **Returns**: User's orders with pagination, status filtering
- **Includes**: Order items, tracking codes, status history

### 5.6 Order Schema
- **Orders Table**:
  - `id`, `user_id`, `tracking_code` (unique)
  - `subtotal`, `tax`, `shipping_cost`, `discount_amount`, `total`
  - `payment_method` ('cash', 'store_credit')
  - `payment_status` ('unpaid', 'paid', 'refunded')
  - `order_status` ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')
  - `shipping_address` (JSON)
  - `notes`, `admin_notes`
  - `created_at`, `updated_at`

- **Order Items Table**:
  - `id`, `order_id`, `product_id`, `project_id`
  - `name`, `price`, `quantity`, `subtotal`
  - `item_type` ('product', 'project', '3d_print')
  - `rental_start_date`, `rental_end_date` (for projects)

- **Order Status History**:
  - `id`, `order_id`, `status`, `changed_by`, `notes`, `created_at`

### 5.7 Admin Order Management
- **List Orders**: `GET /api/store/admin/orders` — All orders with filtering
- **Update Status**: `PUT /api/store/admin/orders/:id/status` — Changes order status
  - Stock restoration on cancellation
  - Wallet refund for store credit payments
  - Audit logging
- **Batch Operations**: Update multiple order statuses at once

---

## 6. E-Commerce: Coupons & Discounts

### 6.1 Coupon Types
- **Fixed Amount**: Specific dollar discount (e.g., $10 off)
- **Percentage**: Percentage discount with max cap (e.g., 15% off, max $50)

### 6.2 Coupon Validation
- **Usage Limits**: Total usage limit, per-user limit
- **Date Range**: `valid_from` and `valid_until` dates
- **Minimum Order**: Minimum order amount required
- **Active Status**: Must be `is_active=1`
- **User Usage**: Checks user hasn't exceeded per-user limit

### 6.3 Coupon Application
- **Endpoint**: `POST /api/store/orders/apply-coupon`
- **Validates**: Coupon exists, is active, within date range, usage limits, minimum order
- **Returns**: Discount amount (fixed or calculated percentage)
- **Checkout Integration**: Applied automatically during checkout

### 6.4 Coupon Schema
- `id`, `code` (unique), `type` ('fixed', 'percentage')
- `value` (discount amount or percentage)
- `min_order_amount`, `max_uses`, `uses_per_user`
- `max_discount_amount` (for percentage coupons)
- `valid_from`, `valid_until`
- `is_active`, `created_at`

### 6.5 Coupon Usage Tracking
- `coupon_usage` table tracks: `coupon_id`, `user_id`, `order_id`, `used_at`

---

## 7. E-Commerce: Wishlist

### 7.1 Wishlist Operations
- **Get Wishlist**: `GET /api/store/wishlist` — Returns all wishlist items with product details
- **Add to Wishlist**: `POST /api/store/wishlist` — Adds product to wishlist
  - Prevents duplicates (composite unique: `user_id, product_id`)
- **Remove from Wishlist**: `DELETE /api/store/wishlist/:productId` — Removes product
- **Wishlist Toggle**: Frontend toggles between add/remove based on current state

### 7.2 Wishlist Schema
- `id`, `user_id`, `product_id`
- `created_at`
- Composite unique constraint on `(user_id, product_id)`

---

## 8. E-Commerce: Reviews & Ratings

### 8.1 Review Operations
- **Get Reviews**: `GET /api/store/reviews/:product_id` — Returns reviews with user info
- **Submit Review**: `POST /api/store/reviews/:product_id`
  - Requires: 1-5 star rating, optional comment
  - Validates: User has a `delivered` order containing this product
  - Prevents: Multiple reviews per product per user
- **Edit Review**: `PUT /api/store/reviews/review/:id` — Edit own review only
- **Delete Review**: `DELETE /api/store/reviews/review/:id` — Delete own review only

### 8.2 Review Schema
- `id`, `product_id`, `user_id`
- `rating` (1-5), `comment`
- `created_at`, `updated_at`
- Soft delete support (`deleted_at`)

### 8.3 Product Rating Update
- On review create/edit/delete, recalculates:
  - `average_rating` (avg of all reviews)
  - `review_count` (total non-deleted reviews)

---

## 9. Wallet System

### 9.1 Wallet Balance
- **Endpoint**: `GET /api/store/wallet`
- **Returns**: Current balance, referral code, social claim status
- **Balance Source**: Sum of all `wallet_transactions` with type `credit` minus `debit`

### 9.2 Transaction History
- **Endpoint**: `GET /api/store/wallet/history`
- **Returns**: All wallet transactions with pagination
- **Types**: `credit` (earned), `debit` (spent), `refund` (cancelled order refund)

### 9.3 Referral System
- **Apply Referral**: `POST /api/store/wallet/referral`
- **Flow**: User enters referral code from another user
  - Validates code exists and belongs to different user
  - Creates `social_claims` entry with `platform='referral'`
  - Credits wallet with referral bonus (configurable amount)
  - Prevents self-referral
  - Prevents duplicate referrals

### 9.4 Social Media Rewards
- **Claim Social**: `POST /api/store/wallet/claim-social`
- **Platforms**: facebook, instagram, twitter, youtube, tiktok
- **Flow**: User claims reward for following/connecting on social media
  - Creates `social_claims` entry with `platform` and `post_url`
  - Credits wallet with social reward (configurable per platform)
  - Prevents duplicate claims per platform

### 9.5 Wallet Transactions Schema
- `id`, `user_id`, `type` ('credit', 'debit', 'refund')
- `amount`, `description`
- `reference_type` ('order', 'referral', 'social', 'admin_credit')
- `reference_id`
- `created_at`

### 9.6 Admin Wallet Operations
- **Credit User**: Admin can credit wallet balance directly
- **Debit User**: Admin can debit wallet balance
- **Audit Logging**: All admin wallet operations logged

---

## 10. Engineering Projects Marketplace

### 10.1 Project Listing
- **Endpoint**: `GET /api/project`
- **Features**:
  - Category filtering
  - Type filtering (sale, rent)
  - Price range filtering
  - Technology filtering
  - Sort: price-asc, price-desc, newest, name-asc
  - Pagination

### 10.2 Project Detail
- **Endpoint**: `GET /api/project/:id`
- **Returns**: Full project data including:
  - Basic info (name, description, price, rental_price)
  - Type (sale/rent)
  - Technologies used (JSON parsed)
  - Components (from `project_components` table)
  - Images
  - Availability calendar (for rentals)
  - Related projects

### 10.3 Project Types
- **Sale**: One-time purchase with stock quantity
- **Rent**: Time-based rental with availability calendar

### 10.4 Rental System
- **Availability Calendar**: `GET /api/project/:id/availability`
  - Shows booked dates from `project_orders` and unified `orders` tables
  - Shows admin-blocked dates from `project_blocked_dates`
  - Returns array of available date ranges

- **Rental Pricing**:
  - Weekly rental rate stored in project
  - Daily rate = weeklyPrice / 7
  - Total = (dailyRate × number of days) + deposit
  - Deposit = 1.5× weekly rental rate

- **Double-Booking Prevention**:
  - Checks both legacy `project_orders` and unified `orders` tables
  - Validates no overlap with existing bookings
  - Validates no overlap with admin-blocked dates

- **Slot Management**:
  - Automatic status updates on checkout/completion/cancellation
  - Tracks rental_start_date and rental_end_date

### 10.5 Project Orders
- **Buy/Rent**: `POST /api/project/:id/order`
- **Fields**: `type` ('buy', 'rent'), `start_date`, `end_date` (for rent)
- **Validation**: Stock check for sales, availability check for rentals
- **Order Creation**: Creates unified order with `item_type='project'`

### 10.6 Custom Project Requests
- **Endpoint**: `POST /api/project/custom-request`
- **Fields**: `name`, `email`, `phone`, `projectName`, `type` ('software', 'hardware', 'embedded'), `description`, `detailedRequirements`
- **No Auth Required**: Public submission
- **Status Flow**: pending → contacted → completed/cancelled
- **Email Notification**: Admin notified of new request

### 10.7 Project Schema
- `id`, `name`, `slug`, `description`
- `price`, `rental_price`, `type` ('sale', 'rent')
- `technologies` (JSON array, validated)
- `image_urls` (JSON array, validated)
- `stock_quantity`, `is_active`
- `deleted_at`, `created_at`, `updated_at`

### 10.8 Project Components
- `project_id`, `product_id`, `quantity`
- Links projects to required components (products)

### 10.9 Project Blocked Dates
- `id`, `project_id`, `start_date`, `end_date`, `reason`, `created_by`
- Admin can block dates for maintenance/events

---

## 11. 3D Printing Service

### 11.1 Supported Formats
- **Upload Formats**: STL, OBJ, 3MF, STP, STEP
- **Max File Size**: 20MB
- **Storage**: S3/R2 (cloud) or local `uploads/3d-models/` (fallback)

### 11.2 Supported Materials
| Material | Density (g/cm³) | Typical Use |
|----------|-----------------|-------------|
| PLA | 1.24 | Prototypes, general purpose |
| PETG | 1.27 | Functional parts, chemical resistance |
| ABS | 1.04 | High-temperature applications |
| Resin | 1.20 | High-detail models |
| ASA | 1.07 | UV-resistant outdoor parts |
| TPU | 1.21 | Flexible, elastic parts |

### 11.3 3D Model Parsing (Client-Side)
- **Loaders**: Three.js STLLoader, OBJLoader, MTLLoader
- **Volume Calculation**: Signed tetrahedron method for accurate volume
- **Bounding Box**: Calculates model dimensions for display
- **Unit Detection**: Auto-detects mm, cm, in, m with manual override

### 11.4 Real-Time Pricing
- **Formula**: `setupFee + (volume × density × infill × quantity × 1.20) × materialRate`
- **Components**:
  - Setup fee (fixed)
  - Volume (from mesh parsing)
  - Material density
  - Infill percentage
  - Quantity
  - Safety margin (1.20)
  - Material-specific rate

### 11.5 WebGL 3D Preview
- **Renderer**: Three.js WebGL renderer
- **Controls**: OrbitControls for rotation, zoom, pan
- **Features**: Auto-rotate, material-based rendering, grid helper
- **Responsive**: Adapts to container size

### 11.6 Print Order Workflow
1. **Upload**: User uploads 3D model file
2. **Parse**: Client-side mesh parsing calculates volume and bounding box
3. **Configure**: User selects material, color, infill, layer height, quantity
4. **Price**: Real-time price estimation
5. **Submit**: Order placed with `pending_review` status
6. **Admin Review**: Admin reviews and sets quotation price
7. **Approve**: User approves quote and pays with wallet
8. **Print**: Order moves to `printing` status
9. **Complete**: Order moves to `completed` status

### 11.7 Print Order Schema
- `id`, `user_id`
- `model_url`, `model_filename`, `model_size`
- `volume`, `bounding_box` (JSON)
- `material`, `color`, `infill_percentage`, `layer_height`
- `quantity`, `setup_fee`
- `quoted_price`, `total_price`
- `status` ('pending_review', 'quoted', 'approved', 'printing', 'completed', 'cancelled')
- `admin_notes`, `created_at`, `updated_at`

### 11.8 Admin Print Management
- **List Orders**: `GET /api/3d/admin/orders` — All print orders
- **Set Quote**: `PUT /api/3d/admin/orders/:id/quote` — Sets quotation price
- **Update Status**: `PUT /api/3d/admin/orders/:id/status` — Changes print status

---

## 12. Support Ticket System

### 12.1 Ticket Operations
- **List Tickets**: `GET /api/support` — User's tickets with message count
- **Get Ticket**: `GET /api/support/:id` — Ticket with all messages
- **Create Ticket**: `POST /api/support`
  - Fields: `subject`, `message`, `priority` ('low', 'medium', 'high'), `category`
  - Auto-assigns ticket number
- **Reply to Ticket**: `POST /api/support/:id/reply`
  - User can reply to own tickets
  - Admin can reply to any ticket
- **Close Ticket**: `PUT /api/support/:id/close`
  - User can close own tickets
  - Admin can close any ticket

### 12.2 Ticket Schema
- `support_tickets`:
  - `id`, `user_id`, `ticket_number` (unique)
  - `subject`, `priority`, `category`
  - `status` ('open', 'in_progress', 'resolved', 'closed')
  - `created_at`, `updated_at`

- `support_ticket_messages`:
  - `id`, `ticket_id`, `sender_id`
  - `message`, `is_admin`
  - `created_at`

### 12.3 Admin Support Management
- **List All Tickets**: All tickets across all users
- **Filter**: By status, priority, category
- **Reply**: Admin replies marked as `is_admin=true`
- **Close**: Admin can close tickets

---

## 13. Portfolio CMS

### 13.1 Content Management
- **Landing Content**: Section-based key-value pairs
  - Sections: hero, about, services, team, testimonials, contact, footer
  - Each section has multiple key-value pairs
  - Admin can update via bulk update endpoint

- **Services**: CRUD with display ordering
  - Fields: title, description, icon, features (JSON), link
  - Batch operations for reorder, toggle active

- **Team Members**: CRUD with display ordering
  - Fields: name, role, bio, image_url, social_links (JSON)
  - Batch operations for reorder, toggle active

- **Testimonials**: CRUD with display ordering
  - Fields: client_name, client_title, company, content, rating
  - Batch operations for reorder, toggle active

- **Site Settings**: Key-value configuration (188+ settings)
  - Categories: general, appearance, seo, email, social, ecommerce, printing, projects
  - Runtime-configurable, no restart needed
  - Admin-configurable via settings panel

### 13.2 Public API
- **Endpoint**: `GET /api/content`
- **Returns**: All active CMS content:
  - Landing page sections
  - Active services (sorted by display_order)
  - Active team members (with parsed social links)
  - Active testimonials (sorted by display_order)
  - All site settings

### 13.3 Contact Form
- **Endpoint**: `POST /api/content/contact`
- **Fields**: `name`, `email`, `subject`, `message`
- **Rate Limit**: 3 submissions per hour per IP
- **Email Forwarding**: Forwards to admin email (configurable)
- **Storage**: Saves to `contact_messages` table
- **Admin Management**: View, reply, mark as read

### 13.4 Universal Search
- **Endpoint**: `GET /api/content/search`
- **Searches**: Products, projects, blog posts
- **Returns**: Combined results with type indicators

---

## 14. Admin Panel

### 14.1 Dashboard
- **Stats Cards**: Total revenue, orders, users, products
- **Charts**: Revenue over time, orders by status, category breakdown
- **Command Center**: Pending orders across all services, low stock alerts, open tickets
- **Top Products**: Best-selling products by revenue
- **Recent Activity**: Latest orders, user registrations, support tickets

### 14.2 Product Management
- **CRUD Operations**: Create, read, update, delete products
- **Batch Operations**: Delete, toggle active, update category
- **Inventory Management**: Stock quantity, stock type, low stock alerts
- **Search & Filter**: By name, category, stock status
- **CSV Export**: Export product data to CSV

### 14.3 Order Management
- **Unified Orders**: All order types (products, projects, 3D prints) in one table
- **Status Updates**: Change order status with audit logging
- **Cancellation**: Stock restoration, wallet refund for store credit
- **Batch Operations**: Update multiple order statuses
- **Filter**: By status, date range, payment method

### 14.4 User Management
- **CRUD Operations**: Create, read, update, delete users
- **Role Management**: Change user roles (admin, customer)
- **Password Reset**: Admin can reset user passwords
- **Wallet Credits**: Admin can credit/debit user wallets
- **Soft Delete**: Users preserved with `deleted_at` timestamp
- **Self-Protection**: Admins cannot delete themselves or change own role

### 14.5 Project Management
- **CRUD Operations**: Create, read, update, delete projects
- **Components Management**: Link products as project components
- **Blocked Dates**: Manage rental blocked dates
- **Custom Requests**: View and manage custom project requests
- **Batch Operations**: Delete, toggle active

### 14.6 CMS Management
- **Landing Content**: Edit hero, about, services sections
- **Team Members**: CRUD with image upload
- **Testimonials**: CRUD with rating
- **Site Settings**: Edit all site configuration
- **Contact Messages**: View, reply, mark as read

### 14.7 Coupon Management
- **CRUD Operations**: Create, read, update, delete coupons
- **Usage Tracking**: View coupon usage statistics
- **Batch Operations**: Toggle active, delete

### 14.8 3D Print Management
- **Order Management**: View all print orders
- **Quotation**: Set pricing for print orders
- **Status Updates**: Change print status
- **Material Configuration**: Manage materials and pricing

### 14.9 Support Management
- **Ticket Management**: View all tickets across users
- **Reply**: Admin replies to tickets
- **Status Management**: Change ticket status
- **Filter**: By status, priority, category

### 14.10 CRM (Customer Relationship Management)
- **Web Inquiries**: View contact form submissions
- **Messages**: View and reply to messages
- **Revisions**: Track message revisions

### 14.11 Database Manager
- **Direct Table Access**: Browse any database table
- **CRUD Operations**: Create, read, update, delete records
- **Column Validation**: Prevents invalid column names
- **Blocked Table Protection**: Cannot modify sensitive tables:
  - `users`, `wallet_transactions`, `refresh_tokens`, `token_blacklist`, `audit_logs`
- **Read Blocking**: `refresh_tokens`, `token_blacklist`, `audit_logs` hidden from reads
- **SQL Backup**: Full database dump with sensitive field redaction
- **CSV Export**: Export table data to CSV

### 14.12 Settings Management
- **Google Auth**: Configure Google OAuth credentials
- **SMTP**: Configure email server settings
- **Tax Rates**: Configure sales tax percentage
- **Delivery Config**: Configure shipping rates and thresholds
- **3D Printing Rates**: Configure material pricing
- **Social Rewards**: Configure social media reward amounts

### 14.13 Activity Logs
- **Logs**: All admin actions logged
- **Filter**: By action type, date range, admin user
- **Search**: Fulltext search in logs
- **Pagination**: Paginated results

### 14.14 Batch Operations
- **Supported Operations**:
  - Batch delete
  - Batch status update
  - Batch toggle active
  - Batch role change
- **Safety**: Self-protection prevents admins from modifying own account
- **Audit Logging**: All batch operations logged

---

## 15. File Upload System

### 15.1 Storage Configuration
- **Cloud Storage**: AWS S3 or Cloudflare R2
  - Enabled when `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` configured
  - Files served via `CDN_URL` if configured
- **Local Fallback**: `uploads/` directory when cloud not configured
- **File Serving**: Express static middleware serves local files

### 15.2 Upload Categories
- **Avatars**: `uploads/avatars/` — User profile pictures
- **Products**: `uploads/products/` — Product images
- **Projects**: `uploads/projects/` — Project images
- **Team**: `uploads/team/` — Team member photos
- **3D Models**: `uploads/3d-models/` — 3D print files
- **Services**: `uploads/services/` — Service icons
- **Testimonials**: `uploads/testimonials/` — Client photos
- **General**: `uploads/general/` — Miscellaneous uploads

### 15.3 File Validation
- **Size Limits**: Configurable per category
- **Type Validation**: Whitelist of allowed MIME types
- **Filename Sanitization**: Removes special characters, prevents path traversal

### 15.4 Multer Configuration
- **Memory Storage**: For cloud uploads (buffer → S3)
- **Disk Storage**: For local uploads
- **File Filter**: Validates MIME types
- **Limits**: Configurable file size limits

---

## 16. Email System

### 16.1 SMTP Configuration
- **Storage**: `site_settings` database table (admin-configurable)
- **Settings**: `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_secure`
- **Toggle**: `smtp_forward_enabled` to enable/disable email forwarding

### 16.2 Email Queue
- **Async Processing**: Emails queued and sent asynchronously
- **Queue Implementation**: In-memory queue with retry logic
- **Error Handling**: Failed emails logged, retry up to 3 times

### 16.3 Email Templates
- **OTP Verification**: 6-digit code with expiry
- **Password Reset**: Reset link with token
- **Order Confirmation**: Order details, items, total
- **Admin Notification**: New order, new registration
- **Low Stock Alert**: Product below threshold
- **Contact Form Forwarding**: Contact submission details
- **Support Ticket**: New ticket notification
- **Custom Project Request**: New request notification

### 16.4 Email Testing
- **Admin Endpoint**: `POST /api/admin/settings/smtp/test`
- **Validates**: SMTP credentials before saving
- **Returns**: Success/failure with error details

---

## 17. Audit Logging & Security

### 17.1 Hash-Chained Audit Logs
- **Implementation**: Each entry's SHA-256 hash includes previous entry's hash
- **Tamper-Evident**: Any modification breaks the chain
- **Fields**: `id`, `action`, `entity_type`, `entity_id`, `user_id`, `details`, `hash`, `previous_hash`
- **Logged Actions**: Registration, login, logout, password change, profile update, order creation, admin actions

### 17.2 Security Events
- **Purpose**: Track security incidents
- **Fields**: `id`, `event_type`, `severity`, `user_id`, `ip_address`, `details`, `correlation_id`
- **Types**: Failed login, account lockout, IP block, role change, password reset
- **Email Alerts**: Admins notified immediately for critical events

### 17.3 Application Logs
- **Purpose**: General activity logging
- **Fields**: `id`, `action`, `entity_type`, `entity_id`, `user_id`, `details`, `created_at`
- **Filterable**: By action type, date range, user

### 17.4 IP Blocking
- **Database-Driven**: `blocked_ips` table
- **Checked**: On every request (middleware)
- **Auto-Block**: 20 failed logins from same IP → 1-hour block
- **Manual Block**: Admin can block/unblock IPs

### 17.5 Rate Limiting
- **Global**: 1000 requests per 15 minutes per IP
- **Auth**: 15 requests per 15 minutes per IP
- **Register**: 5 requests per 15 minutes per IP
- **Checkout**: 3 requests per 5 minutes per user
- **Contact**: 3 requests per hour per IP

### 17.6 Security Headers (Helmet)
- **Content Security Policy (CSP)**
- **HTTP Strict Transport Security (HSTS)**
- **X-XSS-Protection**
- **X-Content-Type-Options**
- **X-Frame-Options**
- **Referrer-Policy**

### 17.7 CORS Configuration
- **Single-Origin**: Only `FRONTEND_URL` allowed
- **Credentials**: Enabled (for cookies)
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization, X-Requested-With

### 17.8 Input Validation
- **Custom Validator**: `validate.js` middleware
- **Schema Validation**: Validates request body against defined schemas
- **HTML Sanitization**: Escapes HTML entities in user input
- **SQL Injection Prevention**: Parameterized queries + column name validation

---

## 18. Internationalization (i18n)

### 18.1 Language Support
- **Languages**: English (`en`), Nepali (`ne`)
- **Storage**: JSON translation files in `src/locales/`
- **Toggle**: LanguageContext provides `locale` state and `setLocale` function
- **Persistence**: Saved to `localStorage`

### 18.2 Translation System
- **Dot-Path Keys**: `translation.key.subkey` format
- **Fallback**: Falls back to English if Nepali translation missing
- **Components**: All text elements use translation keys

### 18.3 RTL Support
- **Current**: LTR only (English, Nepali are LTR)
- **Architecture**: Supports future RTL languages via CSS logical properties

---

## 19. Theme System (Dark/Light Mode)

### 19.1 Theme Options
- **Dark Mode**: Black background, white text
- **Light Mode**: White background, black text
- **Toggle**: ThemeContext provides `theme` state and `toggleTheme` function
- **Persistence**: Saved to `localStorage`

### 19.2 Implementation
- **CSS Variables**: All colors defined as CSS custom properties
- **Data Attribute**: `data-theme="dark|light"` on `<html>` element
- **Smooth Transition**: CSS transitions on theme change

### 19.3 Color Tokens
- **Background**: `--bg-0` through `--bg-4`
- **Text**: `--text-0` through `--text-3`
- **Status**: `--success`, `--danger`, `--warning`, `--info`
- **Accent**: `--accent`, `--accent-hover`

---

## 20. SEO System

### 20.1 Dynamic Meta Tags
- **Component**: `<SEO>` component in `<head>`
- **Per-Page**: Title, description, keywords, OG tags, Twitter cards
- **JSON-LD**: Structured data for products, breadcrumbs, organization

### 20.2 Sitemap
- **Endpoint**: `GET /sitemap.xml`
- **Dynamic**: Includes all active products and projects
- **Auto-Updated**: Generated on request from database

### 20.3 Robots.txt
- **Endpoint**: `GET /robots.txt`
- **Dynamic**: Allows crawling of public pages, blocks admin

### 20.4 Breadcrumbs
- **Component**: `<Breadcrumbs>` with Schema.org JSON-LD
- **Auto-Generated**: Based on current route

---

## 21. Search System

### 21.1 Product Search
- **Fulltext**: MySQL FULLTEXT index on `name` and `description`
- **Relevance Ranking**: Based on word frequency
- **Filters**: Category, price range, stock status

### 21.2 Project Search
- **Text Search**: Like query on `name` and `description`
- **Filters**: Category, type, technology

### 21.3 Universal Search
- **Endpoint**: `GET /api/content/search`
- **Searches**: Products, projects, blog posts
- **Returns**: Combined results with type indicators

### 21.4 Admin Search
- **Products**: Search by name, category
- **Orders**: Search by tracking code, user email
- **Users**: Search by name, email
- **Tickets**: Search by subject, message

---

## 22. Rate Limiting

### 22.1 Rate Limiter Configuration
- **Global**: 1000 requests per 15 minutes per IP
- **Auth Endpoints**: 15 requests per 15 minutes per IP
- **Registration**: 5 requests per 15 minutes per IP
- **Checkout**: 3 requests per 5 minutes per user
- **Contact Form**: 3 requests per hour per IP

### 22.2 Implementation
- **Library**: `express-rate-limit`
- **Storage**: Memory (default)
- **Headers**: Returns `X-RateLimit-Remaining` and `X-RateLimit-Reset`
- **Response**: 429 Too Many Requests with retry-after

---

## 23. Database Migrations

### 23.1 Migration Scripts
Located in `backend/src/scripts/`:

| Script | Purpose |
|--------|---------|
| `ecommerce_fixes_migration.js` | Project order rental columns, stock |
| `alter_stock_type.js` | Add `out_of_stock` to product stock_type |
| `add_wallet_balance_column.js` | Add wallet_balance to users |
| `migrate_uploads.js` | Restructure uploads into subdirectories |
| `export_schema.js` | Export live DB schema to SQL file |
| `sync_wallet_balances.js` | Recalculate wallet balances from ledger |

### 23.2 Running Migrations
```bash
cd backend
node src/scripts/script_name.js
```

---

## 24. Deployment & Configuration

### 24.1 Environment Variables
- **Backend**: `.env` file with database, JWT, SMTP, AWS settings
- **Frontend**: Vite proxy configuration in `vite.config.js`

### 24.2 Production Build
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

### 24.3 Nginx Configuration
- **Frontend**: Serve static files from `dist/`
- **API**: Proxy `/api/` to backend
- **Uploads**: Proxy `/uploads/` to backend
- **SSL**: Let's Encrypt or commercial certificate

### 24.4 Database Setup
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE himalix;"

# Import schema
mysql -u root -p himalix < database/himalix_latest_schema.sql

# Run migrations
cd backend
node src/scripts/script_name.js
```

---

## 25. API Reference Quick Index

### Public Endpoints (No Auth)
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/google` — Google OAuth
- `POST /api/auth/verify-email` — Verify email
- `POST /api/auth/resend-otp` — Resend OTP
- `POST /api/auth/refresh` — Refresh token
- `POST /api/auth/forgot-password` — Forgot password
- `POST /api/auth/reset-password` — Reset password
- `GET /api/content` — CMS content
- `GET /api/content/section/:section` — Single section
- `POST /api/content/contact` — Contact form
- `GET /api/content/search` — Universal search
- `GET /api/store/products` — Product listing
- `GET /api/store/products/:id` — Product detail
- `GET /api/store/orders/track/:code` — Order tracking
- `GET /api/project` — Project listing
- `GET /api/project/:id` — Project detail
- `GET /api/project/:id/availability` — Rental availability
- `POST /api/project/custom-request` — Custom request
- `GET /sitemap.xml` — Sitemap
- `GET /robots.txt` — Robots

### Authenticated Endpoints
- `GET /api/auth/me` — Profile
- `PUT /api/auth/update` — Update profile
- `PUT /api/auth/password` — Change password
- `POST /api/auth/upload-avatar` — Upload avatar
- `GET /api/store/cart` — Get cart
- `POST /api/store/cart` — Add to cart
- `PUT /api/store/cart/update` — Update cart
- `DELETE /api/store/cart/remove/:id` — Remove from cart
- `DELETE /api/store/cart` — Clear cart
- `POST /api/store/cart/sync` — Sync guest cart
- `POST /api/store/orders/checkout` — Checkout
- `GET /api/store/orders/history` — Order history
- `GET /api/store/orders/shipping` — Calculate shipping
- `POST /api/store/orders/apply-coupon` — Apply coupon
- `GET /api/store/wishlist` — Get wishlist
- `POST /api/store/wishlist` — Add to wishlist
- `DELETE /api/store/wishlist/:productId` — Remove from wishlist
- `GET /api/store/reviews/:product_id` — Get reviews
- `POST /api/store/reviews/:product_id` — Submit review
- `PUT /api/store/reviews/review/:id` — Edit review
- `DELETE /api/store/reviews/review/:id` — Delete review
- `GET /api/store/wallet` — Wallet balance
- `GET /api/store/wallet/history` — Transaction history
- `POST /api/store/wallet/referral` — Apply referral
- `POST /api/store/wallet/claim-social` — Claim social reward
- `POST /api/project/:id/order` — Buy/rent project
- `GET /api/project/orders/my` — My project orders
- `GET /api/3d` — My print orders
- `POST /api/3d/upload` — Upload 3D model
- `POST /api/3d` — Place print order
- `POST /api/3d/checkout/:id` — Approve quote
- `GET /api/support` — My tickets
- `GET /api/support/:id` — Ticket detail
- `POST /api/support` — Create ticket
- `POST /api/support/:id/reply` — Reply to ticket
- `PUT /api/support/:id/close` — Close ticket

### Admin Endpoints (114+)
- `GET /api/admin/dashboard` — Dashboard stats
- `GET /api/admin/stats` — Detailed statistics
- `GET /api/admin/command-center` — Command center
- `GET /api/store/admin/products` — List products
- `POST /api/store/admin/products` — Create product
- `PUT /api/store/admin/products/:id` — Update product
- `DELETE /api/store/admin/products/:id` — Delete product
- `GET /api/store/admin/orders` — List orders
- `PUT /api/store/admin/orders/:id/status` — Update order status
- `GET /api/store/admin/users` — List users
- `PUT /api/store/admin/users/:id` — Update user
- `DELETE /api/store/admin/users/:id` — Delete user
- `GET /api/project/admin` — List projects
- `POST /api/project/admin` — Create project
- `PUT /api/project/admin/:id` — Update project
- `DELETE /api/project/admin/:id` — Delete project
- `GET /api/3d/admin/orders` — List print orders
- `PUT /api/3d/admin/orders/:id/quote` — Set quote
- `GET /api/support/admin` — List all tickets
- `POST /api/support/admin/:id/reply` — Admin reply
- `GET /api/admin/content` — CMS content
- `PUT /api/admin/content` — Update content
- `GET /api/admin/services` — List services
- `POST /api/admin/services` — Create service
- `PUT /api/admin/services/:id` — Update service
- `DELETE /api/admin/services/:id` — Delete service
- `GET /api/admin/team` — List team
- `POST /api/admin/team` — Create member
- `PUT /api/admin/team/:id` — Update member
- `DELETE /api/admin/team/:id` — Delete member
- `GET /api/admin/testimonials` — List testimonials
- `POST /api/admin/testimonials` — Create testimonial
- `PUT /api/admin/testimonials/:id` — Update testimonial
- `DELETE /api/admin/testimonials/:id` — Delete testimonial
- `GET /api/admin/coupons` — List coupons
- `POST /api/admin/coupons` — Create coupon
- `PUT /api/admin/coupons/:id` — Update coupon
- `DELETE /api/admin/coupons/:id` — Delete coupon
- `GET /api/admin/settings` — Get settings
- `PUT /api/admin/settings` — Update settings
- `POST /api/admin/settings/smtp/test` — Test SMTP
- `GET /api/admin/logs` — Activity logs
- `GET /api/admin/logs/security` — Security events
- `GET /api/admin/db/:table` — Database table
- `POST /api/admin/db/:table` — Create record
- `PUT /api/admin/db/:table/:id` — Update record
- `DELETE /api/admin/db/:table/:id` — Delete record
- `POST /api/admin/db/backup` — Database backup
- `POST /api/admin/batch` — Batch operations

---

*Document generated by OpenCode AI — 20 subagents explored every file, component, API endpoint, database table, and feature in this project.*
