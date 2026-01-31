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
    - **Service Technician**: Home screen with assignments and route, Property Detail with checklists and quick actions, Emergency reporting, Truck inventory, Chat with property channels, and "Road to Success" training tracker (Training tab).
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
    - **Heritage Products Catalog**: 600+ pool products with role-based pricing visibility.
        - **Product Data**: `client/lib/heritageProducts.ts` - Categories include Pumps, Filters, Heaters, Automation, Valves, Chemicals, Cleaners, Lighting, Covers, Safety, Plumbing, Motors, Parts, Tools, Labor.
        - **Shared Component**: `client/components/ProductCatalog.tsx` - Reusable component with search, category/subcategory filtering.
        - **Role-Based Visibility**:
            - Repair Tech: Full pricing visible, can create repair estimates
            - Service Tech: NO pricing visible, items auto-track to commission when added
            - Supervisor: Full pricing visible, can create work orders with technician assignment
        - **Navigation**: Products tab available on all roles with package icon.
    - **Ace AI Assistant**: AI-powered estimate creation with voice input and self-learning capabilities.
        - **Entry Point**: `client/screens/RepairTech/AceEstimateBuilderScreen.tsx`
        - **AI Search**: Uses GPT-4o-mini to match user descriptions to products
        - **Voice Input**: Records audio via `expo-audio`, transcribes via OpenAI Whisper
        - **Self-Learning System**: 
            - **Database Tables**: `ai_learning_interactions`, `ai_product_feedback`, `ai_product_patterns`, `ai_query_mappings`
            - **API Routes**: `server/routes/ai-learning.ts` - Logs interactions, feedback, and estimate completions
            - **Learning Flow**: 
                1. User queries are logged with suggested products
                2. Product selections/rejections are recorded as feedback
                3. Estimate completions track product co-occurrence patterns
                4. Future searches use learned mappings to improve recommendations
            - **Pattern Recognition**: Products frequently used together are suggested automatically
            - **Query Mappings**: Successful user queries are mapped to products for future use

## External Dependencies
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT (JSON Web Tokens), bcrypt
- **Mobile Development**: Expo (React Native), React Navigation, TanStack Query, AsyncStorage, SecureStore, `@react-native-community/netinfo`, `expo-battery`.
- **Backend Framework**: Express.js

## API Configuration

### Dual Backend Architecture
The app uses two separate backends:

1. **Mobile API (Auth + Data)**: `EXPO_PUBLIC_API_URL`
   - URL: `https://breakpoint-api-v2.onrender.com`
   - Used for: Login, registration, user data, assignments, properties, chat
   - Auth: JWT Bearer token in `Authorization` header

2. **Tech Ops API (BI Admin)**: `EXPO_PUBLIC_TECHOPS_URL`
   - URL: `https://breakpoint-app.onrender.com`
   - Used for: Repair requests (Tech Ops Alerts)
   - Auth: Mobile API key in `X-MOBILE-KEY` header

**Note**: Replit Secrets/Configuration overrides `.env` files. Always set environment variables in the Replit Secrets pane.

### URL Helper Functions (client/lib/query-client.ts)
- **`getApiUrl()`**: Returns the main API base URL (`EXPO_PUBLIC_API_URL`).
- **`getTechOpsUrl()`**: Returns the Tech Ops API URL (`EXPO_PUBLIC_TECHOPS_URL`), falls back to main API if not set.
- **`joinUrl(base, path)`**: Safely joins a base URL with a path, ensuring exactly one "/" between them.
- **`techOpsRequest(route, data)`**: POSTs to Tech Ops API with `X-MOBILE-KEY` header.

**Important**: Always use `joinUrl()` or `new URL(path, base)` when constructing API URLs. Never use string concatenation like `${baseUrl}path` as this can result in missing slashes.

### Pagination Support (client/lib/query-client.ts)
The backend API returns paginated responses in the format `{ items: T[], nextCursor: string | null }`.

**Helper Types and Functions**:
- **`Page<T>`**: Type interface for paginated responses
- **`extractItems<T>(data)`**: Safely extracts array from paginated or raw array responses
- **`extractNextCursor(data)`**: Extracts nextCursor for infinite scroll/load more

**Usage Pattern**:
```typescript
// For simple lists (useQuery)
const { data } = useQuery({ queryKey: ['/api/properties'] });
const properties = extractItems(data); // Always returns T[]

// For infinite scroll (useInfiniteQuery)
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['/api/assignments'],
  getNextPageParam: (lastPage) => extractNextCursor(lastPage),
});
const allAssignments = data?.pages.flatMap(extractItems) ?? [];
```