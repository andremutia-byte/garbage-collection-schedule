# Garbage Collection Schedule System

A modern, responsive web application for managing municipal garbage collection schedules, pickup routes, zone assignments, and resident notifications. Built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, **Clerk Authentication**, and **Supabase (PostgreSQL with Row Level Security)**.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Roles & Permissions](#roles--permissions)
- [Tech Stack](#tech-stack)
- [Architecture & Security](#architecture--security)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone and Install](#1-clone-and-install)
  - [2. Environment Variables](#2-environment-variables)
  - [3. Database Setup & Migrations](#3-database-setup--migrations)
  - [4. Run the Development Server](#4-run-the-development-server)
- [Verification & Quality Checks](#verification--quality-checks)
- [Project Structure](#project-structure)
- [License](#license)

---

## Overview

The **Garbage Collection Schedule System** bridges municipal sanitation departments and residents. It provides:
- **Residents** with instant visibility into their upcoming trash and recycling pickup days, localized zone guidelines, collection schedules, and real-time alerts.
- **Administrators and Dispatchers** with full operational control over service zones, resident records, addresses, scheduled pickups, pickup batch generation, and aggregated activity statistics.

---

## Key Features

### Resident Experience (`/dashboard`)
- **Upcoming Pickups Card:** Displays the next scheduled pickup date, waste category (Biodegradable, Non-Biodegradable, Recyclable, Hazardous), and status badge (Scheduled, In Progress, Completed, Missed).
- **Service Details & Assigned Zone:** View registered address, assigned collection zone, pickup frequency, and local waste disposal instructions.
- **Interactive Collection Calendar:** Filter schedules by waste category, inspect collection dates, and view collection time windows.
- **Notification Inbox:** Real-time collection updates, route changes, and holiday reschedule notices with mark-as-read tracking.

### Administrator & Dispatcher Portal (`/admin`)
- **Operations Dashboard:** Live metrics including Total Residents, Total Addresses, Total Zones, Upcoming Pickups, Completed Pickups, and Missed Pickups.
- **Activity & Distribution Reports:** Real-time collection activity feed and category breakdowns calculated directly from Supabase.
- **Zone Management (`/admin/zones`):** Create and edit municipal zones with specific colors, collection days, and pickup instructions.
- **Address Registry (`/admin/addresses`):** Register household addresses and link them directly to designated service zones.
- **Resident Directory (`/admin/residents`):** Manage residents, review linked Clerk identities, and update service assignments.
- **Collection Schedules (`/admin/schedules`):** Define recurring collection schedules and generate batch pickup tasks across zones.

---

## Roles & Permissions

The application implements strict Role-Based Access Control (RBAC) enforced through Clerk metadata and Supabase Row Level Security (RLS):

| Role | Access Privileges | Where Defined |
| :--- | :--- | :--- |
| **Resident** (`resident`) | Can access `/dashboard`. Can only read their own address, pickup schedule, and notifications via RLS (`user_id = auth.jwt() ->> 'sub'`). Access to `/admin` routes is strictly blocked. | Clerk `publicMetadata.role = 'resident'` |
| **Admin** (`admin`) | Full administrative access to `/admin` and `/dashboard`. Can manage all zones, addresses, residents, and schedules. Can generate pickups and view system metrics. | Clerk `publicMetadata.role = 'admin'` |
| **Dispatcher** (`dispatcher`) | Can view and update schedules, pickup statuses, and routes in `/admin`. | Clerk `publicMetadata.role = 'dispatcher'` |

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Actions)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict mode enabled)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with Lucide React icons
- **Authentication:** [Clerk](https://clerk.com/) (Middleware-based route protection, JWT-based Supabase integration)
- **Database & Backend:** [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security policies)
- **Webhooks:** Clerk Webhooks verified via `svix` for automatic resident synchronization into Supabase

---

## Architecture & Security

- **Server-Side Validation:** All mutations are executed via Next.js Server Actions with role verification using Clerk session claims.
- **Row Level Security (RLS):** Supabase RLS policies guarantee data isolation. Even direct API calls cannot query records outside a resident's assigned `user_id`.
- **Zero Secrets on Client:** Sensitive keys (`CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `SUPABASE_SECRET_KEY`) are kept exclusively on the server. Client bundles only receive public publishable keys.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A free [Clerk](https://clerk.com/) account
- A free [Supabase](https://supabase.com/) project

### 1. Clone and Install

```bash
git clone https://github.com/andremutia-byte/garbage-collection-schedule.git
cd garbage-collection-schedule
npm install
```

### 2. Environment Variables

Copy the provided `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your actual API keys in `.env.local`:

```ini
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Clerk Webhook Signing Secret (from Clerk Dashboard -> Webhooks)
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# Supabase Data Platform
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key

# Server-only Supabase Secret / Service Role Key
SUPABASE_SECRET_KEY=your-supabase-service-role-or-secret-key
```

> **Warning:** Never commit `.env.local` or expose service role keys to Git.

### 3. Database Setup & Migrations

1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Apply the migration scripts located in `supabase/migrations/` in chronological order:
   - Base schema and RLS policies: `supabase/migrations/20261001000000_init.sql` (or initial schema migration).
   - Notification read-receipt enhancements: `supabase/migrations/20261003000000_notifications_enhancements.sql`.
3. (Optional) Run the migration check helper:
   ```bash
   node scripts/apply-migration.mjs
   ```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Verification & Quality Checks

Run the following checks before committing code to ensure type safety and build health:

```bash
# Run TypeScript compilation check
npx tsc --noEmit

# Run Next.js production build check
npm run build

# Run linting check
npm run lint
```

---

## Project Structure

```text
├── app/
│   ├── actions/               # Server Actions (admin, dashboard, notifications)
│   ├── admin/                 # Admin portal pages (zones, addresses, residents, schedules)
│   │   ├── addresses/         # Address registry management
│   │   ├── residents/         # Resident profile & assignment management
│   │   ├── schedules/         # Collection schedule & pickup generator
│   │   └── zones/             # Service zone configuration
│   ├── api/
│   │   └── webhooks/clerk/    # Webhook handler for Clerk user synchronization
│   ├── dashboard/             # Resident portal (schedules, notifications, calendar)
│   ├── unauthorized/          # Access denied view for non-admin accounts
│   ├── layout.tsx             # Root application layout with Clerk Provider
│   └── page.tsx               # Public product landing page
├── lib/
│   ├── admin-auth.ts          # Server-side admin authorization verification
│   └── supabase/              # Supabase client configurations (server, client, admin)
├── public/                    # Static assets and icons
├── scripts/                   # Migration and operational helper scripts
├── supabase/                  # SQL migrations and schema definitions
├── .env.example               # Safe template for required environment variables
└── README.md                  # Project documentation
```

---

## License

This project is created for educational and municipal sanitation workflow automation. Distributed under the MIT License.
