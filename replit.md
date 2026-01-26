# Breakpoint Commercial Pool Systems

## Overview
Breakpoint Commercial Pool Systems is a mobile-first field service management application designed for commercial pool maintenance technicians. It aims to streamline daily operations, emergency responses, and team management for commercial pool services. The project's vision is to enhance efficiency, safety, and communication within field service teams, providing a comprehensive tool for service, repair, and supervisory roles. It is currently in a production beta phase with robust authentication and role-based access.

## User Preferences
- Mobile-first design matching iOS Human Interface Guidelines
- Azure Blue as primary action color
- Large touch targets for field use
- Drag-to-reorder for job prioritization
- Dark gradient background for auth screens

## System Architecture

### UI/UX Decisions
- **Color Scheme**: Azure Blue (#0078D4) as primary, Vivid Tangerine (#FF8000) as accent, Tropical Teal (#17BEBB), Emerald (#22D69A) for success, Danger (#FF3B30).
- **Styling**: Custom theme system for consistent brand application.
- **Components**: Reusable UI components including custom Badges, Buttons, and various Card types (JobCard, NextStopCard, MetricCard, EstimateCard).
- **Backgrounds**: Shimmer effects on logo and role cards; dark gradient for auth screens, light bubble backgrounds for some role-specific screens.
- **Accessibility**: Large touch targets for field use, `keyboardShouldPersistTaps="handled"` for all `ScrollView` and `FlatList` components to ensure proper mobile keyboard handling.

### Technical Implementations
- **Frontend**: Developed with Expo (React Native).
    - **Entry Point**: `client/App.tsx`.
    - **Navigation**: React Navigation 7+ utilizing native stack and bottom tabs.
    - **State Management**: TanStack Query for server state, React Context for authentication and network status.
    - **Data Storage**: AsyncStorage for general data, SecureStore for sensitive tokens.
    - **Offline Mode**: Comprehensive support including network detection (`@react-native-community/netinfo`), visual offline banner, action queuing for sync upon reconnection, data caching with TTL, auto-sync, and last sync display.
    - **Battery Saver Mode**: Automatic activation at 50% battery, real-time monitoring (`expo-battery`), reduced animations, decreased sync frequency, critical mode at 20%, manual toggle, and visual indicators.
- **Backend**: Implemented using Express.js.
    - **Entry Point**: `server/index.ts`.
    - **API Port**: 5000.
    - **Database ORM**: Drizzle ORM.
    - **Authentication**: JWT tokens with bcrypt hashing, 7-day expiry, token storage in sessions table.

### Feature Specifications
- **Authentication**: JWT tokens, bcrypt hashing, secure storage, role-based access for Service Technician, Repair Technician, and Supervisor.
- **User Roles**:
    - **Service Technician**: Home screen with assignments and route, Property Detail with checklists and quick actions, Emergency reporting, Truck inventory, and Chat with property channels.
    - **Repair Technician**: Home screen with jobs, Queue for managing repair tasks, Estimates, Jobs list. Includes swipeable job cards and product catalog for estimates.
    - **Supervisor**: Team dashboard with activity ticker, metrics, and Team Tracker. Assignment management, QC inspections with detailed checklists, Real-time "Who's On" tech tracking, Truck inspection with damage marking, Supportive actions documentation, and Roster management.
- **Core Features**:
    - **Chat System**: Office communication, direct messages, urgent alerts, and property-specific channels.
    - **Emergency Reporting**: Dedicated screen for technicians to report emergencies with admin notifications.
    - **Inventory Management**: For truck stock.
    - **QC Inspections**: Comprehensive checklists for commercial pools.
    - **Team Tracking**: Live view of technician status and progress.
    - **Vehicle Inspections**: Digital forms with visual damage marking.
    - **Assignment Management**: Creation and overview of technician assignments.
    - **Performance Coaching**: Documentation system for supportive actions.

## External Dependencies
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT (JSON Web Tokens), bcrypt
- **Mobile Development**: Expo (React Native), React Navigation, TanStack Query, AsyncStorage, SecureStore, `@react-native-community/netinfo`, `expo-battery`.
- **Backend Framework**: Express.js

## API Configuration

### EXPO_PUBLIC_API_URL
The external API base URL is configured via `EXPO_PUBLIC_API_URL` environment variable.

**Format**: The URL can end with or without a trailing slash - both formats work correctly.
- `https://breakpoint-api-v2.onrender.com` ✓
- `https://breakpoint-api-v2.onrender.com/` ✓

### URL Helper Functions (client/lib/query-client.ts)
- **`getApiUrl()`**: Returns the API base URL with trailing slashes removed.
- **`joinUrl(base, path)`**: Safely joins a base URL with a path, ensuring exactly one "/" between them. Handles all edge cases:
  - `joinUrl("https://x.com", "api/auth/me")` → `https://x.com/api/auth/me`
  - `joinUrl("https://x.com/", "/api/auth/me")` → `https://x.com/api/auth/me`

**Important**: Always use `joinUrl()` or `new URL(path, base)` when constructing API URLs. Never use string concatenation like `${baseUrl}path` as this can result in missing slashes.