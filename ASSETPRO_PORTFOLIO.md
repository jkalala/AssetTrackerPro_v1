## AssetPro — Intelligent Asset Tracking and Operations Platform

### Value Proposition
- **Control and visibility**: Track every asset’s lifecycle, location, status, and utilization in real time.
- **Operational efficiency**: Reduce loss, improve maintenance planning, and streamline check-in/out.
- **Actionable insights**: Analytics and custom reporting drive better utilization and cost decisions.
- **Enterprise-ready**: SSO, RBAC, rate-limiting, auditing, and GDPR endpoints built-in.

### Core Features
- **Asset lifecycle management**: Create, edit, categorize, assign, retire, and restore assets.
- **QR codes at scale**: Generate, template, print, and scan; batch operations and label designer.
- **Bulk import/export**: CSV/XLSX import with history/undo; export for analytics and audits.
- **Analytics and reports**: Real-time KPIs, charts, custom report builder, PDF export.
- **Geofencing and rules**: Define zones, enforce rules, view history, and trigger notifications.
- **Maintenance**: Scheduling, history, and predictive maintenance preview.
- **Notifications**: Email (SMTP), push (Firebase), in-app toasts; webhook integrations.
- **Teams and roles**: Invitations, membership, granular roles/permissions (RBAC).
- **Security & compliance**: OAuth/SSO, GDPR data export/delete, audit logs, rate limiting.
- **Docs and API**: Built-in API docs explorer with Swagger UI.

### User Experience
- **Modern UI**: Radix primitives with shadcn-inspired components, Tailwind CSS 4.
- **Responsive and fast**: App Router (Next.js 15), edge-first where it makes sense.
- **Localization**: i18n with multiple locales (`/public/locales`).
- **Maps and charts**: React Leaflet for geofencing; Recharts for visual analytics.

### Architecture and Infrastructure
- **Frontend**: Next.js 15 (App Router) + React 18 + TypeScript (strict), Tailwind CSS v4.
- **API**: Route handlers under `app/api/*` (Node/Edge where appropriate).
- **Auth and Data**: Supabase (Postgres, Auth, Realtime).
- **Rate limiting**: Upstash Redis/RateLimit on sensitive endpoints.
- **Observability**: Sentry configuration for edge/server monitoring.
- **Messaging/Email**: Firebase Admin (push), Nodemailer (email).
- **Docs**: Swagger UI served via `app/api/docs`.
- **Predictive maintenance (preview)**: Containerized Python microservice (`ml-service/`) for model inference.

### Technical Highlights
- **TypeScript-first**: Strict mode on; robust types across server and client.
- **Supabase SSR**: Secure cookie handling via `@supabase/ssr` for server routes and middleware.
- **RBAC utilities**: `lib/rbac/*` for permission checks across UI and API.
- **Tailwind v4 setup**: PostCSS plugin via `@tailwindcss/postcss` for modern pipeline.
- **Geofence editor**: `react-leaflet` + `react-leaflet-draw` with persisted zone rules.
- **QR tooling**: `qrcode` for generation; `jspdf` for report/label export.
- **Bulk operations**: `papaparse` and `xlsx` for import/export; history + undo endpoints.
- **Edge/runtime choices**: Edge for lightweight, compute-near-user endpoints; Node where libraries need it.

### Data and Security
- **Schema and RLS**: SQL migration scripts (`/scripts`) add tables, functions, and row-level security.
- **OAuth & SSO**: Standard flows; GitHub setup guides and SSO endpoints included.
- **GDPR**: Export and delete-user-data endpoints under `app/api/gdpr/*`.
- **Auditability**: Audit logs endpoints for traceability and compliance.

### DevEx and Testing
- **Tooling**: pnpm, TypeScript, ESLint, Jest setup, Playwright e2e tests.
- **Monorepo conveniences**: Shared TS configs, path aliases (`@/*`), strict linting.
- **Local/Cloud parity**: Environment-driven configuration; production-ready defaults.

### Deployment Topology (typical)
- **Web**: Next.js deployed to Vercel or Node server with edge support.
- **Data/Auth**: Managed Supabase (Postgres, Auth, Realtime).
- **Rate limit/cache**: Upstash Redis.
- **Observability**: Sentry DSN for server/edge reporting.
- **ML**: Optional container (`ml-service/`) on a small Node/VM or serverless container.

### Roadmap (examples)
- **Deeper predictive maintenance** with scheduled model refresh and feedback loops.
- **Extended integrations** (ERP/CMMS/ITAM).
- **Mobile-first workflows** for offline scanning and batch operations.

### Why It Stands Out
- **Full lifecycle** from acquisition to retirement with analytics baked in.
- **Production-grade** auth, security, and RLS—not just a demo.
- **Operational polish**: bulk ops, QR at scale, geofencing rules, and strong UX.

— Built with Next.js 15, TypeScript (strict), Tailwind v4, Supabase, and a modular API design.
