export interface Technician {
  id: string;
  name: string;
  role: 'service_tech' | 'repair_tech';
  status: 'active' | 'inactive' | 'on_break' | 'running_behind' | 'offline';
  currentStop?: string;
  progress: {
    completed: number;
    total: number;
  };
  phone?: string;
  email?: string;
}

export interface QCInspection {
  id: string;
  propertyName: string;
  technicianName: string;
  time: string;
  date: 'Today' | 'Tomorrow' | string;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'IN_PROGRESS';
  poolName?: string;
  categories?: QCCategory[];
}

export interface QCCategory {
  id: string;
  name: string;
  items: QCItem[];
}

export interface QCItem {
  id: string;
  label: string;
  checked: boolean;
}

export type AssignmentStatus = 'COMPLETED' | 'NOT_COMPLETED' | 'NEED_ASSISTANCE' | 'IN_PROGRESS';
export type AssignmentPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SupervisorAssignment {
  id: string;
  title: string;
  type: string;
  propertyName: string;
  technicianName: string;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  assignedDate: string;
  completedDate?: string;
  notes?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'HOA' | 'Commercial' | 'Apartment' | 'Hotel';
}

export interface WeeklyMetrics {
  assignmentsCreated: number;
  propertiesInspected: number;
  pendingResponses: number;
  qcInspections: number;
}

export type TechnicianStatus = 'active' | 'running_behind' | 'offline' | 'on_break';

export interface TechnicianAssignmentStats {
  total: number;
  completed: number;
  notDone: number;
  needHelp: number;
}

export const mockTechnicians: Technician[] = [
  {
    id: '1',
    name: 'Mike Rodriguez',
    role: 'service_tech',
    status: 'active',
    currentStop: 'SUNNYMEAD RANCH PCA',
    progress: { completed: 4, total: 11 },
    phone: '(951) 555-0123',
    email: 'mike.rodriguez@breakpoint.com',
  },
  {
    id: '2',
    name: 'Jorge Martinez',
    role: 'service_tech',
    status: 'active',
    currentStop: 'RIVERSIDE PALMS HOA',
    progress: { completed: 6, total: 9 },
    phone: '(951) 555-0124',
    email: 'jorge.martinez@breakpoint.com',
  },
  {
    id: '3',
    name: 'Sarah Chen',
    role: 'repair_tech',
    status: 'active',
    currentStop: 'HOLIDAY INN EXPRESS',
    progress: { completed: 3, total: 8 },
    phone: '(951) 555-0125',
    email: 'sarah.chen@breakpoint.com',
  },
  {
    id: '4',
    name: 'Alex Johnson',
    role: 'service_tech',
    status: 'inactive',
    progress: { completed: 0, total: 5 },
    phone: '(951) 555-0126',
    email: 'alex.johnson@breakpoint.com',
  },
];

export const mockTechnicianAssignmentStats: Record<string, TechnicianAssignmentStats> = {
  '1': { total: 12, completed: 7, notDone: 3, needHelp: 2 },
  '2': { total: 8, completed: 5, notDone: 2, needHelp: 1 },
  '3': { total: 10, completed: 6, notDone: 3, needHelp: 1 },
  '4': { total: 5, completed: 2, notDone: 2, needHelp: 1 },
};

export const mockQCInspections: QCInspection[] = [
  {
    id: '1',
    propertyName: 'SUNNYMEAD RANCH PCA',
    technicianName: 'John Smith',
    time: '9:00 AM',
    date: 'Today',
    status: 'PENDING',
    poolName: 'Main Pool',
    categories: [
      {
        id: 'c1',
        name: 'Water Quality',
        items: [
          { id: 'i1', label: 'pH levels within range', checked: false },
          { id: 'i2', label: 'Chlorine levels adequate', checked: false },
          { id: 'i3', label: 'Water clarity acceptable', checked: false },
        ],
      },
      {
        id: 'c2',
        name: 'Equipment',
        items: [
          { id: 'i4', label: 'Pump operating correctly', checked: false },
          { id: 'i5', label: 'Filter pressure normal', checked: false },
          { id: 'i6', label: 'Skimmer baskets clean', checked: false },
        ],
      },
      {
        id: 'c3',
        name: 'Safety',
        items: [
          { id: 'i7', label: 'Safety equipment present', checked: false },
          { id: 'i8', label: 'Signage visible', checked: false },
          { id: 'i9', label: 'Barriers intact', checked: false },
        ],
      },
      {
        id: 'c4',
        name: 'Cleanliness',
        items: [
          { id: 'i10', label: 'Deck area clean', checked: false },
          { id: 'i11', label: 'Restrooms stocked', checked: false },
          { id: 'i12', label: 'Trash removed', checked: false },
        ],
      },
      {
        id: 'c5',
        name: 'Documentation',
        items: [
          { id: 'i13', label: 'Log book updated', checked: false },
          { id: 'i14', label: 'Photos taken', checked: false },
          { id: 'i15', label: 'Notes added', checked: false },
        ],
      },
    ],
  },
  {
    id: '2',
    propertyName: 'RIVERSIDE PALMS HOA',
    technicianName: 'Maria Garcia',
    time: '10:30 AM',
    date: 'Today',
    status: 'SCHEDULED',
    poolName: 'Community Pool',
  },
  {
    id: '3',
    propertyName: 'HOLIDAY INN EXPRESS',
    technicianName: 'David Chen',
    time: '2:00 PM',
    date: 'Today',
    status: 'PENDING',
    poolName: 'Outdoor Pool',
  },
  {
    id: '4',
    propertyName: 'CORONA HILLS ESTATES',
    technicianName: 'John Smith',
    time: '8:30 AM',
    date: 'Tomorrow',
    status: 'SCHEDULED',
    poolName: 'Olympic Pool',
  },
  {
    id: '5',
    propertyName: 'PARKVIEW APARTMENTS',
    technicianName: 'Sarah Johnson',
    time: '11:00 AM',
    date: 'Tomorrow',
    status: 'PENDING',
    poolName: 'Resident Pool',
  },
  {
    id: '6',
    propertyName: 'MARRIOTT COURTYARD',
    technicianName: 'Mike Wilson',
    time: '3:30 PM',
    date: 'Tomorrow',
    status: 'SCHEDULED',
    poolName: 'Guest Pool',
  },
];

export const mockSupervisorAssignments: SupervisorAssignment[] = [
  {
    id: '1',
    title: 'TESTING 1',
    type: 'Chemical Balance',
    propertyName: 'SUNNYMEAD RANCH PCA',
    technicianName: 'John Smith',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    assignedDate: 'Jan 20, 2026',
    completedDate: 'Jan 21, 2026',
    notes: 'pH levels were adjusted. All readings now within normal range.',
  },
  {
    id: '2',
    title: 'Filter Inspection',
    type: 'Equipment Check',
    propertyName: 'RIVERSIDE PALMS HOA',
    technicianName: 'Maria Garcia',
    priority: 'HIGH',
    status: 'COMPLETED',
    assignedDate: 'Jan 19, 2026',
    completedDate: 'Jan 20, 2026',
  },
  {
    id: '3',
    title: 'Pump Repair',
    type: 'Repair',
    propertyName: 'HOLIDAY INN EXPRESS',
    technicianName: 'David Chen',
    priority: 'HIGH',
    status: 'NOT_COMPLETED',
    assignedDate: 'Jan 21, 2026',
    notes: 'Waiting for replacement parts.',
  },
  {
    id: '4',
    title: 'Weekly Service',
    type: 'Routine Maintenance',
    propertyName: 'CORONA HILLS ESTATES',
    technicianName: 'John Smith',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    assignedDate: 'Jan 18, 2026',
    completedDate: 'Jan 18, 2026',
  },
  {
    id: '5',
    title: 'Heater Check',
    type: 'Equipment Check',
    propertyName: 'PARKVIEW APARTMENTS',
    technicianName: 'Sarah Johnson',
    priority: 'LOW',
    status: 'NEED_ASSISTANCE',
    assignedDate: 'Jan 20, 2026',
    notes: 'Need supervisor approval for replacement.',
  },
  {
    id: '6',
    title: 'Emergency Cleanup',
    type: 'Cleanup',
    propertyName: 'MARRIOTT COURTYARD',
    technicianName: 'Mike Wilson',
    priority: 'HIGH',
    status: 'COMPLETED',
    assignedDate: 'Jan 19, 2026',
    completedDate: 'Jan 19, 2026',
  },
  {
    id: '7',
    title: 'Chemical Delivery',
    type: 'Delivery',
    propertyName: 'SUNNYMEAD RANCH PCA',
    technicianName: 'Maria Garcia',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    assignedDate: 'Jan 17, 2026',
    completedDate: 'Jan 17, 2026',
  },
  {
    id: '8',
    title: 'Leak Investigation',
    type: 'Repair',
    propertyName: 'RIVERSIDE PALMS HOA',
    technicianName: 'David Chen',
    priority: 'HIGH',
    status: 'NOT_COMPLETED',
    assignedDate: 'Jan 21, 2026',
  },
  {
    id: '9',
    title: 'Tile Repair',
    type: 'Repair',
    propertyName: 'HOLIDAY INN EXPRESS',
    technicianName: 'Mike Wilson',
    priority: 'LOW',
    status: 'COMPLETED',
    assignedDate: 'Jan 16, 2026',
    completedDate: 'Jan 18, 2026',
  },
  {
    id: '10',
    title: 'Safety Inspection',
    type: 'Inspection',
    propertyName: 'CORONA HILLS ESTATES',
    technicianName: 'Sarah Johnson',
    priority: 'MEDIUM',
    status: 'NOT_COMPLETED',
    assignedDate: 'Jan 22, 2026',
  },
];

export const mockProperties: Property[] = [
  { id: '1', name: 'SUNNYMEAD RANCH PCA', address: '24100 Sunnymead Blvd, Moreno Valley', type: 'HOA' },
  { id: '2', name: 'RIVERSIDE PALMS HOA', address: '15800 Palm Canyon Dr, Riverside', type: 'HOA' },
  { id: '3', name: 'HOLIDAY INN EXPRESS', address: '3400 Market St, Riverside', type: 'Hotel' },
  { id: '4', name: 'PARKVIEW APARTMENTS', address: '2200 University Ave, Riverside', type: 'Apartment' },
  { id: '5', name: 'CORONA HILLS ESTATES', address: '1500 Foothill Pkwy, Corona', type: 'HOA' },
  { id: '6', name: 'MARRIOTT COURTYARD', address: '1510 University Ave, Riverside', type: 'Hotel' },
];

export const mockWeeklyMetrics: WeeklyMetrics = {
  assignmentsCreated: 12,
  propertiesInspected: 8,
  pendingResponses: 3,
  qcInspections: 5,
};

export const supervisorInfo = {
  name: 'Demo Supervisor',
  region: 'Inland Empire',
  email: 'supervisor@breakpoint.com',
  phone: '(951) 555-0100',
};
