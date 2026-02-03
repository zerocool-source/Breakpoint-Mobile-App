# Breakpoint Commercial Pool Systems

## Overview
Breakpoint Commercial Pool Systems is a mobile-first field service management application for commercial pool maintenance. It streamlines daily operations, emergency responses, and team management to enhance efficiency, safety, and communication for service, repair, and supervisory roles. The project is currently in a production beta phase with robust authentication and role-based access.

## User Preferences
- Mobile-first design matching iOS Human Interface Guidelines
- Azure Blue as primary action color
- Large touch targets for field use
- Drag-to-reorder for job prioritization
- Dark gradient background for auth screens

## System Architecture

### UI/UX Decisions
- **Color Scheme**: Azure Blue (#0078D4) as primary, Vivid Tangerine (#FF8000) as accent, with Tropical Teal, Emerald, and Danger for status indicators.
- **Styling**: Custom theme system and reusable UI components including Badges, Buttons, and various Card types.
- **Backgrounds**: Shimmer effects, dark gradients for authentication, and light bubble backgrounds for role-specific screens.
- **Accessibility**: Large touch targets and proper mobile keyboard handling for `ScrollView` and `FlatList` components.

### Technical Implementations
- **Frontend**: Developed with Expo (React Native), using React Navigation for navigation, TanStack Query for server state, and React Context for authentication and network status. Data is stored using AsyncStorage and SecureStore.
- **Offline Mode**: Comprehensive support including network detection, visual offline banner, action queuing, data caching with TTL, auto-sync, and last sync display.
- **Battery Saver Mode**: Automatic activation based on battery level, reducing animations and sync frequency, with visual indicators.
- **Backend**: Implemented with Express.js, using Drizzle ORM for database interaction and JWT for authentication.

### Feature Specifications
- **Authentication**: JWT tokens, bcrypt hashing, and secure storage supporting role-based access (Service Technician, Repair Technician, Supervisor).
- **User Roles**: Each role has a dedicated dashboard and specific functionalities.
    - **Service Technician**: Assignments, property details, emergency reporting, truck inventory, chat, and training tracker.
    - **Repair Technician**: Job queue, estimates, jobs list, chat. Features a two-tier job system (Approved Repairs and Assessments) and integrates with an Ace AI Estimate Builder.
    - **Repair Foreman**: Enhanced estimate management role with dedicated dashboard showing estimate stats (drafts, sent, approved), recent estimates list, draft management (resume, delete, autosave tracking), customer management (search, add, profiles), access to full Ace AI Estimate Builder with voice input, and print/export functionality for PDF generation and sharing. Autosave runs every 3 seconds with visual indicator.
    - **Supervisor**: Team dashboard, activity ticker, metrics, team tracker, assignment management, QC inspections, real-time tech tracking, vehicle inspections, performance coaching, and roster management.
- **Core Features**:
    - **Chat System**: Office communication, direct messages, urgent alerts, and property-specific channels.
    - **Emergency Reporting**: Dedicated screen for technicians to report emergencies.
    - **Inventory Management**: For truck stock.
    - **QC Inspections**: Checklists for commercial pools.
    - **Team Tracking**: Live view of technician status.
    - **Vehicle Inspections**: Digital forms with damage marking.
    - **Assignment Management**: Creation and overview of technician assignments.
    - **Performance Coaching**: Documentation system for supportive actions.
    - **Heritage Products Catalog**: Over 1,457 pool products with role-based pricing visibility and search/filtering capabilities.
    - **Ace AI Assistant**: AI-powered estimate creation with voice input, personalized self-learning based on user interactions, and web-enhanced product search. Includes a Quote Description Screen with HOA-friendly/professional language toggles and California Pool Code references.
    - **Pool Regulations Database**: Stores California pool codes with layman's explanations for integration into AI-generated quotes.

## External Dependencies
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT (JSON Web Tokens), bcrypt
- **Mobile Development**: Expo (React Native), React Navigation, TanStack Query, AsyncStorage, SecureStore, `@react-native-community/netinfo`, `expo-battery`.
- **Backend Framework**: Express.js
- **AI/ML**: OpenAI (for Whisper and GPT models)