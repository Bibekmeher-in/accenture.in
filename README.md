# TEKNIXX

A professional corporate website and admin portal built with Next.js and React.

## Overview

TEKNIXX is a full-stack digital solution featuring a modern, responsive public-facing website and a secure, role-based administrative dashboard for content and lead management.

## Features

Public website:
- Home
- About
- Services
- Portfolio
- Blog
- Contact
- Learning
- Store
- Legal pages (Privacy Policy, Terms and Conditions, Cookie Policy)

Admin:
- Dashboard
- Leads
- Services
- Portfolio
- Blog
- Analytics
- Cookies
- Learning
- Store
- Users
- Audit Logs
- Settings

## Technology

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- MongoDB
- Zod
- JWT Authentication / RBAC
- Custom Analytics

## Project Structure

```
Accenture/
├── docs/             # Project documentation (authentication, analytics architecture)
├── public/           # Static assets
├── scripts/          # Administrative utility scripts
├── src/
│   ├── app/          # Next.js App Router pages and API routes
│   ├── components/   # Reusable UI components (analytics, blocks, layout, ui, cookies)
│   ├── data/         # Static content and mock data
│   └── lib/          # Core utilities (MongoDB, auth, validation, analytics)
```

## Getting Started

Prerequisites:
- Node.js (v18+)
- npm
- Local MongoDB instance

Install dependencies:
```bash
npm install
```

Configure environment variables:
Copy `.env.example` to `.env` and update the required values. Never commit `.env` containing real secrets.

Start the development server:
```bash
npm run dev
```

## Environment Variables

The application requires the following environment variables to be configured in `.env`:
- `MONGODB_URI`: Connection string for the MongoDB database
- `JWT_SECRET`: Secret key for signing authentication tokens
- `NEXT_PUBLIC_APP_URL`: Base URL of the application

## Database

The project uses MongoDB for data persistence. By default, development relies on a local MongoDB instance. Connection pooling and client sharing are configured in `src/lib/mongodb.ts` for optimal performance in Serverless environments.

## Admin Panel

The administrative panel (`/admin`) provides comprehensive management capabilities across all modules, including Leads, Services, Portfolio, Blog, Learning, Store, and Users. Access is protected by JWT authentication and Role-Based Access Control (RBAC).

## Contact and Leads

The lead management flow operates as follows:
1. User submits the Contact Form on the public site.
2. The API validates the submission using Zod.
3. The lead is stored in the MongoDB database.
4. The lead becomes available in the Admin Leads dashboard.
5. Administrators can manage the lead's status, priority, assignment, notes, and follow-up activities.

## Analytics and Privacy

The application implements a custom, privacy-focused analytics system. It respects user cookie consent, allowing visitors to opt-in or opt-out via the Cookie Banner. Tracking identifiers are only set when explicit consent is granted, in compliance with standard privacy policies.

## Security

Security controls implemented include:
- Server-side data validation (Zod)
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Secure session handling via HttpOnly cookies
- Protected API routes and Server Actions
- Comprehensive Audit Logging for admin actions

## Learning

The Learning module provides educational content management capabilities, manageable directly through the admin dashboard.

## Store

The Store module acts as a catalog management system.
*Note: Checkout and payment processing are not currently configured.*

## Testing

Run linting to check code quality:
```bash
npm run lint
```

Create a production build:
```bash
npm run build
```

## Deployment Notes

When deploying to production, consider the following:
- Ensure all environment variables are securely injected via the hosting platform.
- Configure MongoDB for production usage (e.g., MongoDB Atlas).
- Implement a strategy for JWT secret rotation.
- Secure admin passwords and enforce rotation policies.
- Configure SMTP/Email services if future reply functionality is added to the contact flow.

## Project Status

Deployment candidate after final production environment and security verification.

## Development Team

- **Project Owner / Lead:** Bibekananda Meher
- **Developer / Technical Contributor:** Lokanath Meher

## License

Private / Proprietary. All rights reserved.
