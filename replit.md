# Breakpoint Commercial Pool Systems

## Overview
Mobile-first field service management app for commercial pool maintenance technicians. Built with Expo (React Native) and Express.js backend.

## Current State
- **MVP Phase**: Repair Tech and Service Tech flows complete
- **User Roles**: 
  - Service Technician (implemented) - Route-based daily service
  - Repair Technician (implemented) - Repairs, estimates, jobs
  - Supervisor (planned)
  - Repair Foreman (planned)

## Project Architecture

### Frontend (Expo React Native)
- **Entry**: `client/App.tsx`
- **Navigation**: React Navigation 7+ with native stack and bottom tabs
- **State**: TanStack Query for server state, React Context for auth/network
- **Storage**: AsyncStorage for data, SecureStore for tokens
- **Styling**: Custom theme system with brand colors

### Backend (Express.js)
- **Entry**: `server/index.ts`
- **Port**: 5000 (API only)
- **Database**: PostgreSQL with Drizzle ORM (prepared, not yet used)

### Key Directories
```
client/
├── components/      # Reusable UI components
├── constants/       # Theme, colors, spacing
├── context/         # AuthContext, NetworkContext
├── hooks/           # Custom hooks
├── lib/             # API client, storage, mock data
├── navigation/      # Navigation structure
├── screens/         # Screen components
│   ├── RepairTech/  # Repair tech screens
│   ├── ServiceTech/ # Service tech screens
│   └── Modals/      # Modal screens
└── types/           # TypeScript interfaces
```

## Brand Colors
- **Azure Blue**: #0078D4 (primary)
- **Vivid Tangerine**: #FF8000 (accent)
- **Tropical Teal**: #17BEBB
- **Emerald**: #22D69A (success)
- **Danger**: #FF3B30

## Auth Flow
1. Splash Screen (2 seconds)
2. Role Selection Screen (4 roles with distinct icons)
3. Role-specific Login Screen
4. Role-specific App

## Service Technician Features
- **Home Screen**: Blue gradient header, assignments card (orange), next stop, today's progress, route list
- **Property Detail Screen**: On-site timer, pump room checklist, quick actions, bodies of water
- **Truck Screen**: Inventory management (+/- controls), performance maintenance tracking
- **Chat Screen**: Office communication
- **Profile Screen**: Settings, sign out
- **Bottom Tabs**: Home, Chat, Profile, Truck

## Repair Technician Features
- **Home**: Greeting, next stop card, quick actions grid, draggable jobs list
- **Queue**: Metrics cards (2x2), priority filter, grouped job sections
- **Estimates**: List view with status badges
- **Jobs**: List view with priority badges
- **Profile**: User info, settings, sign out
- **Bottom Tabs**: Home, Queue, Estimates, Jobs, Profile

## Running the App
- **Frontend**: `npm run expo:dev` (port 8081)
- **Backend**: `npm run server:dev` (port 5000)

## Recent Changes
- January 2026: Added Service Technician app with complete flow
- January 2026: Updated logo to official Breakpoint "Keeping People Safe" branding
- Role selection as landing page with 4 distinct role cards
- Custom components: Badge, BPButton, JobCard, NextStopCard, MetricCard, EstimateCard

## User Preferences
- Mobile-first design matching iOS Human Interface Guidelines
- Azure Blue as primary action color
- Large touch targets for field use
- Drag-to-reorder for job prioritization
- Dark gradient background for auth screens
