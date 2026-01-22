# Breakpoint Commercial Pool Systems

## Overview
Mobile-first field service management app for commercial pool maintenance technicians. Built with Expo (React Native) and Express.js backend.

## Current State
- **MVP Phase**: Repair Tech flow complete with splash, login, 5-tab navigation, and core features
- **User Roles**: Repair Technician (implemented), Service Technician (planned)

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
│   └── Modals/      # Modal screens
└── types/           # TypeScript interfaces
```

## Brand Colors
- **Azure Blue**: #0078D4 (primary)
- **Vivid Tangerine**: #FF8000 (accent)
- **Tropical Teal**: #17BEBB
- **Emerald**: #22D69A (success)
- **Danger**: #FF3B30

## Features Implemented
- Splash screen with animated logo (2 seconds)
- Login screen with email/password
- Repair Tech bottom tabs: Home, Queue, Estimates, Jobs, Profile
- Home: Greeting, next stop card, quick actions grid, draggable jobs list
- Queue: Metrics cards (2x2), priority filter, grouped job sections
- Estimates: List view with status badges
- Jobs: List view with priority badges
- Profile: User info, settings, sign out
- Report Issue modal: Property picker, issue type, description, priority, photos
- Chat modal: Support conversation interface
- Create Estimate modal: Line items, totals calculation
- Offline banner (appears when disconnected)
- Chat FAB (floating action button)

## Running the App
- **Frontend**: `npm run expo:dev` (port 8081)
- **Backend**: `npm run server:dev` (port 5000)

## Recent Changes
- January 2026: Initial MVP build with Repair Tech flow
- Custom components: Badge, BPButton, JobCard, NextStopCard, MetricCard, EstimateCard
- Image assets generated for app icon, splash, and empty states

## User Preferences
- Mobile-first design matching iOS Human Interface Guidelines
- Azure Blue as primary action color
- Large touch targets for field use
- Drag-to-reorder for job prioritization
