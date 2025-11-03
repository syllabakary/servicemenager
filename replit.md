# Services Locaux - Local Services Platform

## Overview

This is a professional local services website that connects users with service providers for home services like cleaning, childcare, and gardening. The platform allows users to discover services, find agencies by city, and request quotes online. Built as a modern, responsive web application with a focus on trust, professionalism, and ease of use.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing instead of React Router
- Single-page application (SPA) architecture with multiple routes

**UI Component System**
- Shadcn/UI component library using Radix UI primitives for accessibility
- Tailwind CSS for utility-first styling with custom design tokens
- Design system based on "New York" Shadcn variant with custom color palette
- CSS variables for theming (light mode configured, dark mode support prepared)
- Framer Motion for animations and transitions

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management
- Custom query client configuration with infinite stale time and disabled refetching
- Form state managed via React Hook Form with Zod validation
- Local component state using React hooks

**Design Principles**
- Mobile-first responsive design
- Professional blue (#2A63F5) primary color scheme
- Poppins/Inter font family for modern typography
- Inspired by Azaé.com aesthetic with warm modernism approach
- Lucide React icons for consistent iconography

### Backend Architecture

**Server Framework**
- Express.js REST API server
- TypeScript for type safety across the stack
- Custom middleware for request logging and JSON parsing
- Development mode integrates with Vite middleware for SSR support

**API Design**
- RESTful endpoints following resource-based patterns:
  - `GET /api/services` - List all services
  - `GET /api/agencies` - List all agencies
  - `GET /api/agencies/:id` - Get agency details
  - `POST /api/quote-requests` - Submit quote requests
- JSON response format with proper HTTP status codes
- Zod schema validation on API inputs

**Data Layer**
- Drizzle ORM for database abstraction and type-safe queries
- PostgreSQL as the database (via Neon serverless driver)
- Schema-first approach with shared types between client and server
- In-memory storage implementation (MemStorage) for development/testing
- Storage abstraction layer (IStorage interface) for easy database swapping

**Database Schema**
- `services` table: Service offerings (id, name, description, icon)
- `agencies` table: Service provider locations (id, name, city, services array, contact info, image)
- `quote_requests` table: User quote submissions (id, name, email, service, message, timestamp)

### Project Structure

**Monorepo Organization**
- `/client` - Frontend React application
  - `/src/components` - Reusable UI components
  - `/src/pages` - Route-based page components
  - `/src/lib` - Utilities and configuration
  - `/src/hooks` - Custom React hooks
- `/server` - Backend Express application
  - `routes.ts` - API route definitions
  - `storage.ts` - Data access layer
  - `vite.ts` - Development server integration
- `/shared` - Shared TypeScript types and schemas
  - `schema.ts` - Drizzle database schema and Zod validators
- `/attached_assets` - Static assets and generated images

**Path Aliases**
- `@/` maps to `client/src/`
- `@shared/` maps to `shared/`
- `@assets/` maps to `attached_assets/`

### Build & Deployment

**Development**
- `npm run dev` - Starts Express server with Vite middleware
- Hot module replacement for instant updates
- TypeScript checking via `npm run check`

**Production Build**
- `npm run build` - Bundles client with Vite, bundles server with esbuild
- Client output: `dist/public/`
- Server output: `dist/index.js` (ESM format)
- `npm start` - Runs production server

**Database Management**
- Drizzle Kit for schema migrations
- `npm run db:push` - Push schema changes to database
- Migration files stored in `/migrations`

## External Dependencies

**Database**
- PostgreSQL database (via Neon serverless)
- Connection via `DATABASE_URL` environment variable
- Drizzle ORM for query building and migrations

**UI Component Libraries**
- Radix UI primitives (20+ components: Dialog, Dropdown, Select, etc.)
- Lucide React for icons
- Embla Carousel for carousels (if needed)
- cmdk for command palette functionality

**Form Handling**
- React Hook Form for form state management
- Zod for runtime validation
- @hookform/resolvers for Zod integration

**Development Tools**
- Replit-specific plugins for development environment
  - Runtime error overlay
  - Cartographer for code intelligence
  - Dev banner for development mode indication

**Date Handling**
- date-fns for date formatting and manipulation

**Session Management**
- connect-pg-simple for PostgreSQL-backed sessions (configured but session routes not yet implemented)

**Styling Dependencies**
- Tailwind CSS with PostCSS and Autoprefixer
- class-variance-authority (CVA) for variant-based component styling
- tailwind-merge and clsx for conditional class composition