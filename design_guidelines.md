# Breakpoint Commercial Pool Systems - Design Guidelines

## Brand Identity

**Purpose**: Field service management app for pool maintenance technicians (Repair Tech) and route-based service technicians (Service Tech). Enables efficient job tracking, estimates, route management, and field data collection with offline capabilities.

**Aesthetic Direction**: Professional utility with bold color coding by user role. Clean, scan-friendly interface optimized for outdoor field use with high contrast and large touch targets.

**Memorable Element**: Role-based color theming (Azure Blue for Repair, Royal Purple for Service) with quick-action grids and drag-to-reorder job prioritization.

---

## Navigation Architecture

### Repair Tech Flow
**Root**: Bottom Tab Navigation (5 tabs)
- **Home**: Dashboard with next stop, quick actions, today's jobs
- **Queue**: Job queue with metrics and filters
- **Estimates**: Estimate list, detail, and creation
- **Jobs**: Repair job tracking
- **Profile**: User settings and account

**Modals**: Report Issue, Chat, Create Estimate, Product Search, Photo Preview

### Service Tech Flow
**Root**: Bottom Tab Navigation (3 tabs)
- **Home**: Today's route with drag reorder
- **Truck**: Inventory and supplies
- **Profile**: User settings

**Modals**: Property Service, Pool Service Entry, Chemical Order, Drop-off, Repairs Needed, Service Repairs, Windy Cleanup, Emergency Call, Voice Entry

### Auth Stack
Linear flow: Splash (2s) → Login → Role-based Main App

---

## Color Palette

### Repair Tech Theme
- **Primary**: Azure Blue `#0078D4` (headers, primary buttons, active states)
- **Accent**: Vivid Tangerine `#FF8000` (chat button, secondary actions)
- **Success**: Emerald `#22D69A` (positive actions, completion)
- **Tropical Teal**: `#17BEBB` (informational accents)
- **Danger**: Bright Red `#FF3B30` (emergency, urgent priority)
- **Warning**: Vivid Tangerine `#FF8000`

### Service Tech Theme
- **Primary**: Royal Purple `#4169E1` (headers, primary buttons)
- **Secondary**: Same accent colors as Repair Tech

### Neutrals (Both)
- **Background**: `#F5F5F5` (main app background)
- **Surface**: White `#FFFFFF` (cards, modals)
- **Text Primary**: `#1A1A1A`
- **Text Secondary**: `#666666`
- **Border**: `#E0E0E0`
- **Disabled**: `#CCCCCC`

### Status Badge Colors
- **Urgent**: `#FF3B30`
- **High**: `#FF8000`
- **Normal**: `#0078D4`
- **Low**: `#8E8E93`
- **Completed**: `#22D69A`

---

## Typography

**System Fonts**: SF Pro (iOS) / Roboto (Android)

**Type Scale**:
- **H1 (Screen Titles)**: 28px Bold
- **H2 (Section Headers)**: 20px Semibold
- **H3 (Card Titles)**: 17px Semibold
- **Body**: 15px Regular
- **Small/Label**: 13px Regular
- **Caption**: 11px Regular

---

## Screen-by-Screen Specifications

### Splash Screen
- **Purpose**: Brand introduction, app initialization
- **Layout**: Centered logo with 2-second fade-in animation
- **Header**: None
- **Root View**: Non-scrollable, full-screen gradient background (primary color to lighter tint)
- **Safe Area**: No insets needed (full bleed)

### Login Screen
- **Purpose**: Authentication entry
- **Layout**: 
  - Header: None
  - Main: Centered card with logo, username/password fields, login button
  - Scrollable: Yes (for keyboard)
- **Safe Area**: Top: `insets.top + 60px`, Bottom: `insets.bottom + 40px`

### Repair Tech - Home
- **Purpose**: Dashboard overview, quick access to next stop and jobs
- **Header**: Transparent, avatar (left), chat button (right)
- **Layout**:
  - Greeting + name (bold)
  - Next Stop Card (white surface, shadow, property details)
  - Quick Actions Grid (2x2: Emergency, New Estimate, Order Parts, Report Issue)
  - Today's Jobs List (drag handles, reorderable)
- **Scrollable**: Yes
- **Safe Area**: Top: `headerHeight + 16px`, Bottom: `tabBarHeight + 16px`
- **Components**: Card, Badge, Icon Button, Draggable List Items

### Repair Tech - Queue
- **Purpose**: Job prioritization and filtering
- **Header**: Default with title "Queue"
- **Layout**:
  - Metrics Grid (2x2 cards: My Estimates, Urgent Jobs, Parts Ordered, Completed - tappable to scroll)
  - Priority Filter Dropdown
  - Collapsible Sections (Urgent, High, Normal, Low)
- **Scrollable**: Yes
- **Safe Area**: Top: `16px`, Bottom: `tabBarHeight + 16px`

### Repair Tech - Estimates (List)
- **Purpose**: View all estimates
- **Header**: Default with "New" button (right)
- **Layout**: List of estimate cards (number, property, date, total, status badge)
- **Scrollable**: Yes
- **Safe Area**: Top: `16px`, Bottom: `tabBarHeight + 16px`
- **Empty State**: Use `empty-estimates.png` illustration with "No estimates yet" text

### Repair Tech - Create Estimate
- **Purpose**: Generate customer estimates
- **Header**: "Cancel" (left), "New Estimate" title, "Save" (right - disabled until valid)
- **Layout**: 
  - Form: Property dropdown, line items table, add line button
  - Subtotal/Tax/Total footer
  - Buttons: Save Draft, Send Estimate
- **Scrollable**: Yes (form)
- **Safe Area**: Top: `16px`, Bottom: `insets.bottom + 80px` (floating button clearance)

### Service Tech - Home
- **Purpose**: Today's route with drag reorder
- **Header**: Transparent, avatar (left)
- **Layout**:
  - Greeting + route summary
  - Draggable route stop cards (property name, address, time, pool count)
- **Scrollable**: Yes
- **Safe Area**: Top: `headerHeight + 16px`, Bottom: `tabBarHeight + 16px`
- **Components**: Draggable cards with handle icon

### Service Tech - Property Service
- **Purpose**: Timer and service checklists
- **Header**: Property name, back button (left), emergency button (right - red)
- **Layout**:
  - Active timer display (large, centered)
  - Start/Pause/Complete buttons
  - Pool cards grid (tappable to enter service details)
- **Scrollable**: Yes
- **Safe Area**: Top: `16px`, Bottom: `tabBarHeight + 16px`

### Service Tech - Voice Entry Modal
- **Purpose**: Hands-free note dictation
- **Header**: "Cancel" (left), "Voice Entry" title, "Done" (right)
- **Layout**:
  - Microphone button (large, centered, pulsing when active)
  - Transcribed text display below
  - Waveform visualization
- **Modal**: Full-screen
- **Safe Area**: Top: `insets.top + 60px`, Bottom: `insets.bottom + 40px`

### Chat Modal (Both Roles)
- **Purpose**: Support communication
- **Header**: "Close" (left), "Support Chat" title
- **Layout**: Message list, text input with send button
- **Modal**: Full-screen
- **Floating Action Button**: Orange `#FF8000` circle with chat icon, bottom-right
  - Shadow: `offset: {width: 0, height: 2}`, `opacity: 0.10`, `radius: 2`
  - Position: 16px from right, `tabBarHeight + 16px` from bottom

### Profile (Both Roles)
- **Purpose**: User settings
- **Header**: Default with "Profile" title
- **Layout**:
  - Avatar + name (editable)
  - Settings list: Notifications, Offline Mode, About, Sign Out
- **Scrollable**: Yes
- **Safe Area**: Top: `16px`, Bottom: `tabBarHeight + 16px`

---

## Visual Design System

### Card Design
- **Background**: White
- **Border Radius**: 12px
- **Shadow**: `offset: {width: 0, height: 1}`, `opacity: 0.08`, `radius: 4`
- **Padding**: 16px

### Buttons
- **Primary**: Role-color background, white text, 48px height, bold, rounded 8px
- **Secondary**: White background, role-color border/text, 48px height
- **Danger**: Red background, white text
- **Floating Action**: 56x56 circle, shadow as specified above

### Badges
- **Pill Shape**: Rounded full, padding 6px horizontal, 4px vertical
- **Small Text**: 11px Bold, uppercase
- **Colors**: Match status palette

### Quick Action Grid
- **2x2 Layout**: Equal spacing (12px gap)
- **Tile**: Rounded 12px, colored background (semi-transparent role color), icon + label centered
- **Tap Feedback**: Slight scale down (0.95)

### Drag Handle
- **Icon**: Three horizontal lines (grip icon)
- **Color**: `#CCCCCC`
- **Position**: Left edge of draggable card

### Offline Banner
- **Position**: Top of screen, below header
- **Background**: Orange `#FF8000`
- **Text**: White, "Offline Mode - Changes will sync when connected"
- **Height**: 40px
- **Icon**: Cloud-slash icon (left)

---

## Assets to Generate

| Filename | Description | Where Used |
|----------|-------------|------------|
| `icon.png` | App icon: Breakpoint logo with pool water droplet motif, Azure Blue background | Device home screen |
| `splash-icon.png` | Simplified Breakpoint logo mark | Splash screen center |
| `empty-estimates.png` | Clipboard with checkmark illustration, Azure Blue accent | Estimates screen empty state |
| `empty-jobs.png` | Toolbox illustration, neutral gray with Azure Blue tool handles | Jobs screen empty state |
| `empty-route.png` | Map pin with dotted route line, Royal Purple accent | Service Tech route screen empty state |
| `avatar-default.png` | Generic technician avatar silhouette, neutral gray circle background | Profile, login, headers when no user photo |