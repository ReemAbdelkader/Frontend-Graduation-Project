# Wearly — Standalone Frontend (No Backend)

A complete Angular 18 frontend for the Wearly AI fashion design studio, with **zero backend dependencies**. All auth, admin data, and the AI onboarding chat are mocked client-side. Your team can later swap the mock services for real API calls.

## 🚀 Quick Start

```bash
npm install
ng serve
```

Open http://localhost:4200 — works fully offline, no backend needed.

## 🔐 Hardcoded Authentication

| Role | Email | Password | After login → |
|---|---|---|---|
| Admin | `admin@itigraduation.com` | `Admin@123456` | `/control-center` |
| User | any other email | any password (≥6 chars) | `/onboarding` |

- The role is **stored in localStorage** (`wearly.auth.v1`) — survives page refreshes.
- Registration always creates a regular user and routes straight to `/onboarding` (no separate login step).
- All `/control-center/*` routes are protected by `adminGuard` — non-admins are redirected to `/auth`.

**To swap for real backend auth later**, edit `src/app/core/services/auth.service.ts` — replace the `login()` and `register()` methods with `HttpClient` calls to your `/api/Identity/login` and `/api/Identity/Register` endpoints.

## 🤖 AI Onboarding Chat (`/onboarding`)

- Full-screen dedicated page shown after user login/register (first time only)
- Scripted AI conversation collects style preferences (colors → styles → garments → occasions)
- Quick-reply chips + free-text input + thinking indicator
- "Skip & continue" / "Finish & continue to dashboard" → marks onboarding done → routes to `/dashboard`
- **Completely separate** from the floating chat bubble on other pages

**To swap for real AI later**, edit `src/app/features/onboarding/onboarding.component.ts` — replace the `send()` method's `setTimeout` with a call to `/api/AiChat/send`.

## 🛡️ Admin Control Center

All admin pages live under `/control-center/*` and use **mock data** from `src/app/core/data/admin-mock-data.ts`. All CRUD operations update the local in-memory state (signals) — changes persist for the session.

| Route | Page | Notes |
|---|---|---|
| `/control-center` | Overview | 8 stat cards + SVG donut chart (orders by status) + recent orders table |
| `/control-center/users` | Users | Search + Add User modal — role selector dynamically shows extra printer fields (company name, location, capacity) when "Printer" is selected |
| `/control-center/orders` | Orders | Search + status filter chips + inline status dropdown |
| `/control-center/categories` | Categories | Card grid + Create/Edit/Delete (modal form) |
| `/control-center/products` | Products | Card grid + Create/Edit/Delete — category dropdown pulls from the categories list |
| `/control-center/templates` | Templates | **Read-only** — no edit/delete buttons. "View details" opens a read-only modal with a "belongs to creator" notice |
| `/control-center/moderation` | Moderation | Status filter (Pending/Reviewed/Action Taken/Dismissed) with counts + per-row "What action was taken" input + "Mark as resolved" button |

**To swap for real backend later**, replace the mock data imports in each admin component with calls to a new `AdminApiService` (HttpClient).

## 📋 Routes Overview

| Path | Auth | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/auth` | Public | Sign in / sign up |
| `/shop` | Public | Product grid |
| `/templates` | Public | Template hub |
| `/community` | Public | Community feed |
| `/studio` | Public | Design Studio (teammate's custom work — DO NOT TOUCH) |
| `/dashboard` | `authGuard` | User dashboard |
| `/orders` | `authGuard` | Order history |
| `/onboarding` | `authGuard` | AI onboarding chat |
| `/control-center/*` | `authGuard` + `adminGuard` | All 7 admin pages |

## 📁 Project Structure (new/modified files only)

```
src/app/
├── core/
│   ├── guards/
│   │   └── auth.guard.ts                    # NEW: authGuard + adminGuard
│   ├── data/
│   │   └── admin-mock-data.ts               # NEW: all mock data for admin pages
│   └── services/
│       └── auth.service.ts                  # MODIFIED: hardcoded admin + role persistence
├── features/
│   ├── auth/
│   │   └── auth.component.ts                # MODIFIED: role-based routing
│   ├── onboarding/                          # NEW: AI onboarding chat
│   │   ├── onboarding.component.ts
│   │   ├── onboarding.component.html
│   │   └── onboarding.component.scss
│   └── admin/                               # NEW: entire admin section
│       ├── layout/                          # sidebar + header shell
│       ├── overview/                        # 8 stats + donut chart + recent orders
│       ├── users/                           # Add User modal with printer-specific fields
│       ├── orders/                          # table + inline status dropdown
│       ├── categories/                      # CRUD on mock data
│       ├── products/                        # CRUD, category dropdown from categories list
│       ├── templates/                       # READ-ONLY — no edit/delete
│       └── moderation/                      # filter + "Mark as resolved"
└── app.routes.ts                            # MODIFIED: all routes + guards
```

## ✅ Final Checklist

- ✅ `ng serve` runs with zero errors
- ✅ `admin@itigraduation.com` + `Admin@123456` → `/control-center`
- ✅ Any other login/register → `/onboarding` (AI Chat) → then `/dashboard`
- ✅ All `/control-center/*` routes are protected — non-admin redirects to `/auth`
- ✅ Design Studio (`/studio` + Canvas Editor) files are completely untouched
- ✅ "Add User" form dynamically shows extra fields for Printer role
- ✅ Moderation "Mark as resolved" button works on the frontend
- ✅ Templates page has zero edit/delete buttons for admin
- ✅ All existing user-side pages still work perfectly
- ✅ AI Onboarding Chat is separate from the floating chat bubble

## 🛠️ Build Verification

```bash
$ ng build --configuration development
Application bundle generation complete. [3.4 seconds]
```

Zero errors, zero warnings. All admin components lazy-load as separate chunks.
