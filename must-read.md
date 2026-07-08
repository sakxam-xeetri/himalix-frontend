# IMPORTANT: READ BEFORE PROCEEDING (Frontend-Only Vibe Coding Guidelines)

This is a decoupled frontend-only environment for Himalix Labs. **Please read this document carefully before making any changes.**

---

## ⚠️ CRITICAL CONSTRAINTS FOR AI AGENTS (e.g., Cursor, Copilot, Gemini)

1. **NO BACKEND ACCESS**: This folder is completely isolated from the backend source code and database. You have **NO** ability to edit the backend, database schemas, or API endpoints.
2. **STRICT COMPATIBILITY**: All UI changes and features must work **strictly** and **exclusively** within the existing backend API contract. Do **NOT** write code expecting new backend fields, routes, or database column changes.
3. **FAIL-SAFE DEVELOPMENTS**: If you need data that is not currently provided by the backend API, you must mock it on the client-side or restructure the design to fit the existing JSON responses.

---

## 🎨 Design & Styling Guidelines (Vibe Coding)

* **Design Aesthetic**: Premium, modern, dark mode, with subtle gold/bronze accents.
* **Layout**: Implement glassmorphism (`backdrop-filter: blur()`, semi-transparent borders/backgrounds) and smooth micro-animations.
* **Typography**: Outfit and Inter fonts are loaded. Do not revert to browser default sans-serif.
* **CSS System**: Use the design system defined in `src/index.css`. Avoid ad-hoc utility classes or inline styles where global styles are available.

---

## 📂 Key Frontend Features & Structure

1. **Portfolio & Landing (`src/portfolio/`)**
   - The primary landing page detailing Himalix services, client testimonials, and active team members.
   
2. **Storefront (`src/store/`)**
   - Catalog browsing, cart management, checking out (wallet credit deductions), order tracking, and terms.

3. **3D Custom Printing Service (`src/3d/`)**
   - Interacts with a Three.js visualizer for rendering `.stl` and `.obj` uploads.

4. **Project Components Rental (`src/project/`)**
   - Detail pages displaying component lists and calendar reservations.

5. **Profile Cards (`src/portfolio/MemberProfile.js`)**
   - Displays a dynamic glassmorphic card for each team member using their unique name-based slug (`/:memberEndpoint`).

6. **Unified Administration (`src/admin/`)**
   - Controls and analytics panels for managing site content, store items, project component schedules, support tickets, and logs.

---

## ⚙️ Development Environment

* Run `npm install` followed by `npm run dev` to launch the local Vite development server.
* API proxying is configured in `vite.config.js` to route all `/api` and `/uploads` requests to the active staging server.
