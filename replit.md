# Breakpoint Commercial Pool Systems

## Overview
Mobile-first field service management app for commercial pool maintenance technicians. Built with Expo (React Native) and Express.js backend.

## Current State
- **Production Beta**: Real authentication with PostgreSQL database
- **Authentication**: JWT tokens with bcrypt password hashing, secure token storage
- **User Roles**: 
  - Service Technician (implemented) - Route-based daily service
  - Repair Technician (implemented) - Repairs, estimates, jobs
  - Supervisor (implemented) - Team oversight, QC inspections
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
- **Database**: PostgreSQL with Drizzle ORM (active)
- **Auth**: JWT tokens with bcrypt, 7-day expiry, stored in sessions table

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
- **Emergency Screen**: Report emergencies with admin notification
  - Emergency types: Major Water Leak, Electrical Hazard, Chemical Spill, Injury on Site, Equipment Failure, Other
  - Property selection required
  - Description field for details
  - Stats showing Active, Resolved, Total emergency reports
  - History of recent emergency reports with status badges
- **Truck Screen**: Inventory management (+/- controls), performance maintenance tracking
- **Chat Screen**: Office communication with Property Channels
  - Direct Messages: Office and Supervisor channels
  - Urgent Alerts: Clickable notifications with detail modal
  - Property Channels: Subscribe to specific properties for communication
    - "Manage" button to open PropertyChannelsScreen
    - Toggle switches to add/remove properties from channels
    - Selected properties appear in the Chat screen Property Channels section
- **Profile Screen**: Settings, sign out
- **Bottom Tabs**: Home, Emergency, Chat, Profile, Truck

## Repair Technician Features
- **Home**: Greeting, next stop card, quick actions grid, draggable jobs list
- **Queue**: Metrics cards (2x2), priority filter, grouped job sections
- **Estimates**: List view with status badges
- **Jobs**: List view with priority badges
- **Profile**: User info, settings, sign out
- **Bottom Tabs**: Home, Queue, Estimates, Jobs, Profile

## Supervisor Features
- **Home Screen**: Team dashboard with Activity Ticker, weekly metrics, Team Tracker, QC inspections
  - Team Tracker: View all technicians with status (Active/Running Behind/Offline) and progress
  - Click technician to see Assignment Breakdown modal with route details
  - Quick Actions for: Repairs Needed, Chemical Order, Chemicals Drop-Off, Windy Day Clean Up, Service Repairs, Report Issue, Add Notes, Emergency, Who's On, Truck Inspection, Supportive Actions
- **Activity**: Team activity feed with live updates
- **Assign**: Assignment management with CreateAssignmentModal
- **QC Inspections**: Commercial pool inspection checklists (63 items, 10 categories)
  - Categories: Access, Water Quality, Enclosure & Fencing, Shell & Components, Restrooms, Recirculation Equipment, Circulation Control, Safety Equipment & Signage, Employees & Incident Response, Closure Conditions
  - View all inspections with inspector name, role, property, date, status
  - Progress tracking with completion percentage
  - Expandable/collapsible category sections
  - Property selection required before starting new inspection
- **Who's On Screen**: Real-time view of active technicians in the field
  - Live indicator with last update time
  - Stats row showing Active, On Break, Offline counts
  - Filter buttons: All, Active, Break, Offline
  - Technician cards with status dot, role, current location, progress bar
  - Pull-to-refresh functionality
- **Truck Inspection Screen**: Vehicle condition reports
  - Start new inspection modal with full form
  - Truck number, date, technician, mileage, fuel level, condition
  - Touch-based damage marking on truck images (Front, Rear, Driver Side, Cargo views)
  - Damage types: Dent (red), Scratch (orange), Crack (blue), Missing (purple), Rust (gray), Other (yellow)
  - 16-item vehicle inspection checklist
  - Notes field and submission
  - List of recent inspections with status badges
- **Supportive Actions Screen**: Performance coaching documentation
  - Stats row showing Total, Active, Completed counts
  - Filter buttons: All, Active, Completed
  - Supportive action cards with technician, category, severity, dates
  - New Supportive Action modal with: Technician dropdown, Date picker, Category (Performance, Behavior, Safety, Attendance, Quality), Severity (Low, Medium, High), Issue Description, Action Plan, Follow-Up Date, Photo attachment
- **Team Tracker Modal Features**:
  - Summary stats: Total, Completed, Not Done, Need Help
  - Today's Route: Property stops with status badges (Done, Current, Upcoming)
  - Create Assignment button opens CreateAssignmentModal
  - Send Message button opens chat with technician
- **Profile**: User info, settings, sign out
- **Bottom Tabs**: Overview, Activity, Assign, QC, Chat, Profile
- **Stack Screens**: InspectionDetail, ChatConversation, TruckInspection, SupportiveActions, WhosOn

## Running the App
- **Frontend**: `npm run expo:dev` (port 8081)
- **Backend**: `npm run server:dev` (port 5000)

## Offline Mode
The app includes comprehensive offline support for field technicians:
- **Network Detection**: Automatic connectivity monitoring via `@react-native-community/netinfo`
- **Offline Banner**: Visual indicator when disconnected with pending action count
- **Action Queue**: Queues changes made offline for sync when reconnected
- **Data Caching**: Caches jobs, assignments, properties, estimates, etc. with configurable TTL
- **Auto-Sync**: Automatically syncs queued actions when connection restored
- **Last Sync Display**: Shows time since last successful sync

### Key Files
- `client/lib/offlineService.ts` - Offline queue and caching service
- `client/context/NetworkContext.tsx` - Network state management
- `client/components/OfflineBanner.tsx` - Offline status banner

## Battery Saver Mode
Automatic battery management for extended field time:
- **Auto-Enable at 50%**: Battery saver automatically activates when battery drops to 50%
- **Battery Monitoring**: Real-time battery level and charging status via `expo-battery`
- **Reduced Animations**: Disables non-essential animations when saver is active
- **Reduced Sync Frequency**: Decreases background sync to conserve power
- **Low Power Mode**: Critical mode at 20% with additional restrictions
- **Manual Toggle**: Users can manually enable/disable in Profile settings
- **Visual Indicators**: Orange banner shows when battery saver is active with current percentage

### Key Files
- `client/context/BatteryContext.tsx` - Battery state management
- `client/components/BatterySaverBanner.tsx` - Battery saver UI components

## Recent Changes
- January 22, 2026: Added Property Channels feature for Service Technicians:
  - PropertyChannelsContext for managing subscribed property channels
  - PropertyChannelsScreen with toggle switches to add/remove properties
  - ChatChannelsScreen now shows real property channels from database
  - API endpoints: GET/POST/DELETE /api/property-channels
  - Added 5 sample properties to database for testing
- January 22, 2026: Full Expo Go system check and optimization completed:
  - All 17/17 expo-doctor checks passing
  - TypeScript compiles with zero errors
  - Fixed app.json to use proper square icons (icon.png, android-icon-foreground.png)
  - Installed missing expo-asset peer dependency
  - Removed unused expo-av package (replaced by expo-audio)
  - Deleted unused MainTabNavigator26.tsx file
  - Added reusable Screen wrapper component for consistent layout handling
  - Fixed Team Tracker modal touch handling for Expo Go mobile
- January 22, 2026: Added comprehensive offline mode with action queue, data caching, and auto-sync
- January 22, 2026: Optimized all images with Lanczos resampling for HD mobile displays
- January 22, 2026: Added NotificationBanner component for push notification demos with animated slide-in, haptic feedback, and auto-dismiss
- January 22, 2026: Added demo push notifications to all roles: Service Tech (pool service urgent), Supervisor (health department alert), Repair Tech (power outage emergency)
- January 22, 2026: Added Quick Repairs (Under $500) section to Repair Tech Queue - Operations Manager direct assignment with claim functionality
- January 22, 2026: Added 5 sample quick repair jobs to mock data with priority levels and cost ranges under $500
- January 22, 2026: Added Emergency tab for Service Technicians with dedicated emergency reporting screen
- January 22, 2026: Added Supervisor management features - Who's On (active tech tracking), Truck Inspection (touch damage marking), Supportive Actions (performance coaching)
- January 22, 2026: Added 30 customers to mock data for Supervisor dropdown (AVELINA HOA through Horsethief Canyon Ranch MA)
- January 22, 2026: Added navigation from Supervisor Quick Actions to new screens
- January 22, 2026: System check and optimization - updated number fonts with tabular-nums, fixed deprecated pointerEvents prop, fixed LSP error in voice recorder, fixed hardcoded progress counters
- January 22, 2026: Fixed modal sizing - all bottom sheet modals now have `minHeight: '70%'` to properly display form content on mobile
- January 22, 2026: Added `keyboardShouldPersistTaps="handled"` to ALL ScrollViews and FlatLists across the entire app for proper mobile keyboard handling
- January 22, 2026: Fixed RepairTech HomeScreen scrolling by adding `pointerEvents="none"` to BubbleBackground bubbles container
- January 22, 2026: Fixed keyboard input bug in ALL modals by adding `keyboardShouldPersistTaps="handled"` to ScrollViews (CreateAssignment, OrderParts, ReportIssue, NewEstimate, ChemicalOrder, WindyDayCleanup, ServiceRepair, RepairsNeeded, NewInspection, EmergencyReport)
- January 22, 2026: Enhanced RepairTech with swipeable job cards (left swipe: Navigate, right swipe: Details/Complete)
- January 22, 2026: Changed RepairTech to dark blue BubbleBackground with rising bubbles (matching Supervisor theme)
- January 22, 2026: Enhanced NewEstimateModal with full product catalog and line items functionality
- January 22, 2026: Added ProductPicker with search, category filters (Pumps, Filters, Heaters, etc.), and product list
- January 22, 2026: Line items now include quantity controls, rate display, and running totals with tax calculation
- January 22, 2026: Updated RepairTech tab icons: tool for Queue, clipboard for Jobs, file-text for Estimates
- January 22, 2026: Redesigned Repair Tech app with light bubble background theme
- January 22, 2026: New HomeScreen with blue gradient header, progress cards, next stop, quick actions grid, draggable jobs
- January 22, 2026: New QueueScreen with 2x2 metrics grid and collapsible sections
- January 22, 2026: New JobsScreen with enhanced job cards, attachments, Navigate/Details buttons
- January 22, 2026: Added EmergencyReportModal with property selection, emergency type grid, and auto-admin notification
- January 22, 2026: Added NewEstimateModal, OrderPartsModal, ReportIssueModal for quick actions
- January 22, 2026: Fixed Team Tracker - Assignment Breakdown modal now expands properly with ScrollView
- January 22, 2026: Added Today's Route section showing technician property stops with status
- January 22, 2026: Connected Create Assignment button to CreateAssignmentModal
- January 22, 2026: Updated Expo packages to latest compatible versions
- January 22, 2026: Fixed modal scrolling and safe area handling across all roles
- January 2026: Added Service Technician app with complete flow
- January 2026: Updated logo to official Breakpoint "Keeping People Safe" branding
- Role selection as landing page with 4 distinct role cards
- Shimmer effects: Logo (continuous), Role cards (every 10 seconds)
- Custom components: Badge, BPButton, JobCard, NextStopCard, MetricCard, EstimateCard, LightBubbleBackground

## User Preferences
- Mobile-first design matching iOS Human Interface Guidelines
- Azure Blue as primary action color
- Large touch targets for field use
- Drag-to-reorder for job prioritization
- Dark gradient background for auth screens
