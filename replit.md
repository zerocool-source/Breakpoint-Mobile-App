# Breakpoint Commercial Pool Systems

## Version
**Current Version: v1.2.0** (February 2026)

### Changelog
| Version | Date | Features Added |
|---------|------|----------------|
| v1.2.0 | Feb 2026 | Ace AI Estimate Builder with voice input, personalized self-learning, web-enhanced product search, HOA-friendly quote descriptions with California pool code references |
| v1.1.0 | Feb 2026 | Local authentication system, dual-backend architecture, firstName/lastName user fields |
| v1.0.0 | Jan 2026 | Core app: Role-based access (Service Tech, Repair Tech, Supervisor), Heritage Products Catalog (600+ items), Property management, Assignment tracking, Chat system, Offline mode, Battery saver |

### Versioning Rules
- **Major (x.0.0)**: New role capabilities, major UI overhaul, breaking API changes
- **Minor (1.x.0)**: New features (AI tools, new screens, integrations)
- **Patch (1.0.x)**: Bug fixes, performance improvements, minor UI tweaks

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
        - **Two-Tier Job System**:
            - **Approved Repairs**: Pre-approved work orders with green/emerald styling. Shows "Execute Job" and "Navigate" buttons.
            - **Assessments**: Jobs requiring estimate creation with teal styling. Shows "Create Estimate" (links to Ace AI) and "Navigate" buttons.
        - **Database**: `jobs` table with `job_type` column ('approved_repair' | 'assessment')
        - **Navigate Button**: Opens device maps with property address (iOS Maps, Google Maps on Android/web)
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
    - **Ace AI Assistant**: AI-powered estimate creation with voice input and personalized self-learning capabilities.
        - **Entry Point**: `client/screens/RepairTech/AceEstimateBuilderScreen.tsx`
        - **AI Search**: Uses GPT-4o-mini to match user descriptions to products
        - **Voice Input**: Records audio via `expo-audio`, transcribes via OpenAI Whisper
        - **Personalized Experience**:
            - Greets each user by their first name (e.g., "Hey Alan!")
            - Shows personalized messages when using learned data (e.g., "Based on your past estimates, Alan")
            - All learning is tracked per-user via `userId` in all learning tables
        - **Self-Learning System**: 
            - **Database Tables**: `ai_learning_interactions`, `ai_product_feedback`, `ai_product_patterns`, `ai_query_mappings` (all include `user_id` for per-user learning)
            - **API Routes**: `server/routes/ai-learning.ts` - Logs interactions, feedback, and estimate completions with user context
            - **Learning Flow**: 
                1. User queries are logged with userId and suggested products
                2. Product selections/rejections are recorded as user-specific feedback
                3. Estimate completions track per-user product co-occurrence patterns
                4. Future searches prioritize user-specific learned mappings, with fallback to global patterns
            - **Pattern Recognition**: Products frequently used together by each user are suggested automatically
            - **Query Mappings**: Successful user queries are mapped to products per-user for future use
        - **Quote Description Screen**: `client/screens/RepairTech/QuoteDescriptionScreen.tsx`
            - **Language Toggle**: Segmented control with "HOA-Friendly" (default) and "Professional" options
            - **HOA-Friendly Mode**: AI generates descriptions in simple, non-technical language for property managers and HOA boards
            - **Professional Mode**: AI generates industry-standard technical descriptions
            - **Large Description Input**: 380px minimum height for comfortable editing
            - **Voice Input**: Hold-to-speak voice recording with transcription
            - **AI Generation**: Context-aware prompts based on selected language style
            - **California Pool Code References**: HOA-friendly descriptions cite relevant California Health & Safety Code sections to explain legal requirements for repairs
        - **Pool Regulations Database**: `server/routes/pool-regulations.ts`
            - **Database Table**: `pool_regulations` stores California pool codes extracted from official documents
            - **15 Key Regulations**: Covers anti-entrapment (116064.2), pumps (65525, 3123B), filters (3128B-3132B), disinfection (65529), water quality (65527, 65530), lighting (3115B), GFCI (116049), enclosure (3119B), safety equipment (65540), signage (3120B), maintenance (65535), closure requirements (65545)
            - **HOA Explanations**: Each regulation includes a layman's explanation for property managers
            - **AI Integration**: AI automatically references relevant codes based on product categories in estimates

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

### EAS Build Configuration
For production/preview EAS builds, environment variables are configured in:
- **`app.config.js`**: Defines `extra.apiUrl` and `extra.techOpsUrl` using process.env with hardcoded fallbacks
- **`eas.json`**: Sets `API_URL` and `TECHOPS_URL` env vars for each build profile (development, preview, production)

The app uses `Constants.expoConfig?.extra?.apiUrl` from `expo-constants` to access these values in EAS builds.

**Priority Order for API URLs**:
1. `Constants.expoConfig?.extra?.apiUrl` (EAS builds)
2. `process.env.EXPO_PUBLIC_API_URL` (Expo Go / dev)
3. Hardcoded fallback: `https://breakpoint-api-v2.onrender.com`

### URL Helper Functions (client/lib/query-client.ts)
- **`getApiUrl()`**: Returns the main API base URL using priority order above.
- **`getTechOpsUrl()`**: Returns the Tech Ops API URL using same priority order.
- **`getAuthApiUrl()`**: Returns auth API URL (uses Replit domain in Expo Go, fallback for EAS).
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