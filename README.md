# Last-Mile Delivery Tracker

A professional logistics delivery management platform built from scratch supporting three roles: Customer, Delivery Agent, and Admin. The platform calculates rates, assigns agents (manual & auto), tracks orders through an immutable status timeline, manages failed deliveries, and triggers notifications.

---

## Technical Stack

- **Framework:** Next.js 14/15 App Router (using React Server Components, client actions, route handlers, and proxy middleware)
- **Language:** TypeScript
- **Database ORM:** Prisma ORM v7 with `@prisma/adapter-better-sqlite3` and `better-sqlite3` driver
- **Authentication:** Custom server-side session authentication with `iron-session` (HTTP-only secure cookies) and secure password hashing using `bcryptjs`
- **Styling:** Custom Vanilla CSS with a professional Black & White dashboard design
- **Validation:** Type-safety enforced across API inputs and business logic

---

## Features Matrix

### 1. Authentication & Portals
- **Three Separate Portals:** customer, agent, and admin login pages.
- **Demo Credentials Action:** Quick fill credentials on each portal:
  - **Customer:** `customer@demo.com` / `Customer@123`
  - **Agent:** `agent@demo.com` / `Agent@123`
  - **Admin:** `admin@demo.com` / `Admin@123`
- **Security:** Completely database-backed authentication. Passwords hashed with 12 salt rounds using `bcryptjs`. No plain-text passwords. No external dependencies on OAuth or Supabase Auth.
- **Server-side RBAC:** Authorization checks enforced server-side. Unauthorized redirection to correct portal directories.

### 2. Rate Calculation Engine
- **Volumetric Weight Formula:** `Volumetric Weight = (L × B × H) / 5000`
- **Billable Weight:** `MAX(actual weight, volumetric weight)`
- **Zone Detection:** Configurable zones and pincodes. Pincode queries detect zones. Fallback zone is used when pincodes are unrecognized, allowing customers to enter **ANY pincode and address** without rejection.
- **Rate Matrix Lookup:** Rates looked up dynamically from database:
  - B2B Intra-Zone
  - B2B Inter-Zone
  - B2C Intra-Zone
  - B2C Inter-Zone
- **COD Surcharges:** Configurable COD fees applied only for cash collections.
- **Charge Preview:** Full charge breakdown showing dimensions, actual weight, volumetric weight, billable weight, base charges, and COD fees before booking.

### 3. Agent Assignment Engine
- **Manual Assignment:** Admin picks an available agent and assigns the order.
- **Auto-Assignment Algorithm:** 
  1. Finds all AVAILABLE agents.
  2. Prefers agents mapped to the pickup zone.
  3. Sorts by lowest active workload to balance the queue.
  4. Falls back to other available agents if no agent is in the pickup zone.
- **Availability State:** Agents can toggle their availability status: `AVAILABLE`, `BUSY`, or `OFFLINE`.

### 4. Shipment Lifecycle & Immutable Tracking
- **Order Status Lifecycle:** `CREATED` &rarr; `PICKED_UP` &rarr; `IN_TRANSIT` &rarr; `OUT_FOR_DELIVERY` &rarr; `DELIVERED` or `FAILED`.
- **Immutable Tracking Records:** Every status change inserts an immutable tracking record with timestamp, actor role/name, and optional notes.
- **Rescheduling:** Failed deliveries can be rescheduled. Stores target date and reason. Rescheduling updates order status back to `CREATED` and deactivates the agent, allowing a fresh reassignment and pickup cycle.

---

## Local Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="last-mile-delivery-tracker-super-secret-key-change-in-production-2024"
```

### 3. Run Migrations & Push Schema
```bash
npx prisma generate
npx prisma db push
```

### 4. Seed Database
Seed the demo accounts, fallback zones, area mappings, base rate cards, and COD configs:
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

---

## Production Build & Verification

To run a production build locally:
```bash
npm run build
npm start
```

---

## Vercel Deployment Documentation

This codebase is completely Vercel ready. To deploy:
1. Connect this repository to Vercel.
2. Set Environment Variables in Vercel Console:
   - `DATABASE_URL` (Provide your hosted PostgreSQL database connection URL)
   - `SESSION_SECRET` (Enter a secure 32+ character key)
3. Change the datasource provider inside `prisma/schema.prisma` from `sqlite` to `postgresql` (and remove the driver adapter code if connecting directly to a standard serverless Postgres database).
4. Run deployment.
5. Seed database using `npx prisma db seed` on your deployed database.
