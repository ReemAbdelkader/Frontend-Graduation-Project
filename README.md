# Atlier Frontend

Atlier is an AI-assisted fashion marketplace and design studio. This repository contains the Angular client used by shoppers, creators, printers, and administrators.

The application connects to the Atlier .NET API for authentication, products, templates, saved designs, orders, community activity, payments, notifications, and AI-assisted workflows.

## Related repository

The backend API is available at [FatmaAli111/ITIGraduationProject](https://github.com/FatmaAli111/ITIGraduationProject).

## Highlights

- Interactive garment editor built with Fabric.js
- Product catalog, cart, checkout, and order tracking
- AI image generation and design assistance
- Reusable and community-published design templates
- Creator profiles, likes, comments, saves, and reports
- Style onboarding and personalized dashboard
- Real-time SignalR notifications
- Printer order and profile workspace
- Role-protected administration control center

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Angular 18 with standalone components |
| Language | TypeScript 5.5 |
| Styling | SCSS |
| Design canvas | Fabric.js 7 |
| Real-time updates | Microsoft SignalR client |
| Reactive programming | RxJS 7 |

## Prerequisites

- Node.js 20 LTS or newer
- npm 10 or newer
- The Atlier backend running at `http://localhost:5135`

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the Angular development server:

   ```bash
   npm start
   ```

3. Open [http://localhost:4200](http://localhost:4200).

The development server reloads the page when source files change. Start the backend first if you want to use API-backed features such as sign-in, the shop, the studio, or dashboards.

## Backend connection

Local development expects the API at `http://localhost:5135`. The connection is defined in:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`
- `src/app/core/services/api-config.ts`
- `proxy.conf.json`

The development proxy forwards `/api`, `/uploads`, `/GraphicAssets`, and `/DesignSnapshots` to the API. If the backend URL changes, update the environment and API configuration files together. For a deployed build, replace the localhost value in `environment.prod.ts` and `api-config.ts` with the deployed API origin before building.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm start` | Run the development server on port 4200 |
| `npm run build` | Create an optimized production build in `dist/wearly` |
| `npm run watch` | Rebuild continuously with the development configuration |
| `npm run ng -- <command>` | Run an Angular CLI command |

## Main application areas

| Area | Routes | Access |
| --- | --- | --- |
| Public experience | `/`, `/shop`, `/auth` | Everyone |
| Customer workspace | `/studio`, `/templates`, `/cart`, `/orders`, `/community`, `/dashboard`, `/profile` | Signed-in users |
| Printer workspace | `/printer`, `/printer/orders`, `/printer/profile` | Printer role |
| Admin control center | `/control-center/*` | Admin role |

Authentication state and JWT tokens are managed by the authentication service and attached to API requests by the HTTP interceptor. Route guards protect customer, printer, and administrator pages.

## Project structure

```text
src/
|-- app/
|   |-- core/          # Guards, models, API services, and shared data
|   |-- features/      # Route-level pages and business features
|   |-- shared/        # Reusable UI and design-canvas components
|   |-- app.config.ts  # Application providers and HTTP setup
|   `-- app.routes.ts  # Lazy-loaded routes and access guards
|-- assets/            # Images and other static assets
|-- environments/      # Development and production configuration
`-- styles.scss        # Global styles
```

## Production build

```bash
npm run build
```

Deploy the generated files from `dist/wearly` to a static host. Configure that host to return `index.html` for unknown client-side routes, and ensure the API allows requests from the deployed frontend origin.

## Troubleshooting

- **API requests fail:** confirm the backend is available at `http://localhost:5135` and that the configured API origin matches it.
- **Images do not load:** verify the API is serving its static upload folders and the development proxy is enabled.
- **Notifications do not connect:** sign in first, then confirm `/hubs/notifications` is reachable on the backend.
- **A role page redirects away:** use an account with the required `User`, `Printer`, or `Admin` role.

## Security

Do not commit access tokens, API keys, payment secrets, or production service URLs. Keep environment-specific secrets on the backend and expose only non-sensitive public configuration to the Angular client.
