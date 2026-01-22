export interface Assignment {
  id: string;
  type: 'pool' | 'spa' | 'fountain';
  propertyName: string;
  notes: string;
  assignedAt: string;
  assignedBy: string;
}

export interface BodyOfWater {
  id: string;
  name: string;
  location: string;
  type: 'pool' | 'spa' | 'fountain';
  imageUrl?: string;
  completed: boolean;
}

export interface RouteStop {
  id: string;
  propertyName: string;
  address: string;
  propertyType: 'HOA' | 'Apartment' | 'Hotel' | 'Commercial';
  poolCount: number;
  scheduledTime: string;
  completed: boolean;
  gateCode?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
  bodiesOfWater: BodyOfWater[];
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface MaintenanceItem {
  id: string;
  name: string;
  icon: string;
  milesRemaining: number;
  dueDate: string;
  isUrgent?: boolean;
}

export interface TruckInfo {
  id: string;
  number: string;
  model: string;
  inventory: InventoryItem[];
  maintenance: MaintenanceItem[];
}

export const mockAssignments: Assignment[] = [
  {
    id: '1',
    type: 'pool',
    propertyName: 'SUNNYMEAD RANCH PCA',
    notes: 'yes',
    assignedAt: 'Jan 16, 1:43 PM',
    assignedBy: 'Demo Supervisor',
  },
  {
    id: '2',
    type: 'pool',
    propertyName: 'SUNNYMEAD RANCH PCA',
    notes: 'yes',
    assignedAt: 'Jan 16, 1:43 PM',
    assignedBy: 'Demo Supervisor',
  },
  {
    id: '3',
    type: 'pool',
    propertyName: 'RIVERSIDE PALMS HOA',
    notes: 'Check filter pressure',
    assignedAt: 'Jan 16, 2:15 PM',
    assignedBy: 'Demo Supervisor',
  },
  {
    id: '4',
    type: 'spa',
    propertyName: 'HOLIDAY INN EXPRESS',
    notes: 'Spa heater inspection',
    assignedAt: 'Jan 16, 3:00 PM',
    assignedBy: 'Demo Supervisor',
  },
];

export const mockRouteStops: RouteStop[] = [
  {
    id: '1',
    propertyName: 'SUNNYMEAD RANCH PCA',
    address: '24100 Sunnymead Blvd, Moreno Valley',
    propertyType: 'HOA',
    poolCount: 3,
    scheduledTime: '8:15 AM',
    completed: false,
    gateCode: '1234#',
    contactName: 'John Smith',
    contactPhone: '(951) 555-0123',
    notes: 'Enter through main gate. Pool house key is under mat.',
    bodiesOfWater: [
      { id: 'bow1', name: 'Main Pool', location: 'Clubhouse North', type: 'pool', completed: false },
      { id: 'bow2', name: 'Wader', location: 'Clubhouse South', type: 'pool', completed: false },
      { id: 'bow10', name: 'Spa', location: 'Clubhouse North', type: 'spa', completed: false },
    ],
  },
  {
    id: '2',
    propertyName: 'RIVERSIDE PALMS HOA',
    address: '15800 Palm Canyon Dr, Riverside',
    propertyType: 'HOA',
    poolCount: 1,
    scheduledTime: '9:30 AM',
    completed: false,
    gateCode: '5678#',
    bodiesOfWater: [
      { id: 'bow3', name: 'Community Pool', location: 'Recreation Center', type: 'pool', completed: false },
    ],
  },
  {
    id: '3',
    propertyName: 'HOLIDAY INN EXPRESS',
    address: '3400 Market St, Riverside',
    propertyType: 'Hotel',
    poolCount: 2,
    scheduledTime: '10:45 AM',
    completed: false,
    contactName: 'Front Desk',
    contactPhone: '(951) 555-0456',
    bodiesOfWater: [
      { id: 'bow4', name: 'Outdoor Pool', location: 'Courtyard', type: 'pool', completed: false },
      { id: 'bow5', name: 'Hot Tub', location: 'Courtyard', type: 'spa', completed: false },
    ],
  },
  {
    id: '4',
    propertyName: 'PARKVIEW APARTMENTS',
    address: '2200 University Ave, Riverside',
    propertyType: 'Apartment',
    poolCount: 1,
    scheduledTime: '12:00 PM',
    completed: false,
    gateCode: '9012#',
    bodiesOfWater: [
      { id: 'bow6', name: 'Resident Pool', location: 'Building A', type: 'pool', completed: false },
    ],
  },
  {
    id: '5',
    propertyName: 'CORONA HILLS ESTATES',
    address: '1500 Foothill Pkwy, Corona',
    propertyType: 'HOA',
    poolCount: 3,
    scheduledTime: '1:30 PM',
    completed: false,
    gateCode: '3456#',
    bodiesOfWater: [
      { id: 'bow7', name: 'Olympic Pool', location: 'Main Clubhouse', type: 'pool', completed: false },
      { id: 'bow8', name: 'Wader', location: 'Main Clubhouse', type: 'pool', completed: false },
      { id: 'bow9', name: 'Spa', location: 'Main Clubhouse', type: 'spa', completed: false },
    ],
  },
];

export const mockTruckInfo: TruckInfo = {
  id: 'truck-14',
  number: 'T-14',
  model: '2023 Ford Transit',
  inventory: [
    { id: 'inv1', name: 'Chlorine Tablets', quantity: 25, unit: 'lbs' },
    { id: 'inv2', name: 'pH Up', quantity: 8, unit: 'bottles' },
    { id: 'inv3', name: 'pH Down', quantity: 6, unit: 'bottles' },
    { id: 'inv4', name: 'Algaecide', quantity: 4, unit: 'gallons' },
    { id: 'inv5', name: 'Pool Shock', quantity: 12, unit: 'bags' },
  ],
  maintenance: [
    { id: 'maint1', name: 'Oil Change', icon: 'truck', milesRemaining: 850, dueDate: 'Jan 28, 2026' },
    { id: 'maint2', name: 'Air Filter', icon: 'wind', milesRemaining: 2400, dueDate: 'Mar 15, 2026' },
    { id: 'maint3', name: 'Coolant System', icon: 'thermometer', milesRemaining: 5200, dueDate: 'Jun 1, 2026' },
    { id: 'maint4', name: 'Tire Rotation', icon: 'circle', milesRemaining: 1100, dueDate: 'Feb 10, 2026', isUrgent: true },
  ],
};

export interface DailyProgress {
  stopsCompleted: number;
  totalStops: number;
  chemicals: number;
  repairs: number;
  dropOffs: number;
}

export const mockDailyProgress: DailyProgress = {
  stopsCompleted: 0,
  totalStops: 5,
  chemicals: 0,
  repairs: 0,
  dropOffs: 0,
};
