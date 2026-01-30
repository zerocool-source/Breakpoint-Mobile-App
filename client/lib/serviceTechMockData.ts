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

export const mockAssignments: Assignment[] = [];

export const mockRouteStops: RouteStop[] = [
  {
    id: 'stop-1',
    propertyName: 'Sunrise Apartments',
    address: '1250 Palm Valley Dr, Phoenix, AZ 85016',
    propertyType: 'Apartment',
    poolCount: 2,
    scheduledTime: '9:00 AM',
    completed: false,
    gateCode: '4521',
    contactName: 'Maria Santos',
    contactPhone: '(602) 555-0142',
    notes: 'Check filter pressure - reported low flow last week',
    bodiesOfWater: [
      { id: 'bow-1a', name: 'Main Pool', location: 'Courtyard A', type: 'pool', completed: false },
      { id: 'bow-1b', name: 'Spa', location: 'Courtyard A', type: 'spa', completed: false },
    ],
  },
  {
    id: 'stop-2',
    propertyName: 'Desert Ridge HOA',
    address: '8900 E Desert Ridge Pkwy, Scottsdale, AZ 85255',
    propertyType: 'HOA',
    poolCount: 3,
    scheduledTime: '10:30 AM',
    completed: false,
    gateCode: '1234#',
    contactName: 'Tom Williams',
    contactPhone: '(480) 555-0198',
    notes: 'New salt cell installed last month - monitor levels',
    bodiesOfWater: [
      { id: 'bow-2a', name: 'Community Pool', location: 'Clubhouse', type: 'pool', completed: false },
      { id: 'bow-2b', name: 'Kiddie Pool', location: 'Clubhouse', type: 'pool', completed: false },
      { id: 'bow-2c', name: 'Hot Tub', location: 'Clubhouse', type: 'spa', completed: false },
    ],
  },
  {
    id: 'stop-3',
    propertyName: 'Marriott Courtyard',
    address: '2101 E Camelback Rd, Phoenix, AZ 85016',
    propertyType: 'Hotel',
    poolCount: 2,
    scheduledTime: '12:00 PM',
    completed: false,
    contactName: 'Front Desk',
    contactPhone: '(602) 555-0300',
    notes: 'High guest usage - double check sanitizer levels',
    bodiesOfWater: [
      { id: 'bow-3a', name: 'Outdoor Pool', location: 'Pool Deck', type: 'pool', completed: false },
      { id: 'bow-3b', name: 'Indoor Spa', location: 'Fitness Center', type: 'spa', completed: false },
    ],
  },
  {
    id: 'stop-4',
    propertyName: 'Paradise Valley Estates',
    address: '6700 N Mockingbird Ln, Paradise Valley, AZ 85253',
    propertyType: 'HOA',
    poolCount: 4,
    scheduledTime: '2:00 PM',
    completed: false,
    gateCode: '9876*',
    contactName: 'Jennifer Lee',
    contactPhone: '(480) 555-0267',
    notes: 'VIP community - extra attention to detail required',
    bodiesOfWater: [
      { id: 'bow-4a', name: 'Olympic Pool', location: 'Main Clubhouse', type: 'pool', completed: false },
      { id: 'bow-4b', name: 'Lap Pool', location: 'Fitness Center', type: 'pool', completed: false },
      { id: 'bow-4c', name: 'Kids Splash Pad', location: 'Family Area', type: 'pool', completed: false },
      { id: 'bow-4d', name: 'Adults Only Spa', location: 'Main Clubhouse', type: 'spa', completed: false },
    ],
  },
  {
    id: 'stop-5',
    propertyName: 'Camelback Tower',
    address: '2425 E Camelback Rd, Phoenix, AZ 85016',
    propertyType: 'Commercial',
    poolCount: 1,
    scheduledTime: '3:30 PM',
    completed: false,
    contactName: 'Building Manager',
    contactPhone: '(602) 555-0455',
    notes: 'Rooftop pool - access via service elevator',
    bodiesOfWater: [
      { id: 'bow-5a', name: 'Rooftop Infinity Pool', location: 'Level 25', type: 'pool', completed: false },
    ],
  },
];

export const mockTruckInfo: TruckInfo = {
  id: '',
  number: '',
  model: '',
  inventory: [],
  maintenance: [],
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
  totalStops: 0,
  chemicals: 0,
  repairs: 0,
  dropOffs: 0,
};

export interface CommissionItem {
  id: string;
  name: string;
  type: 'product' | 'part' | 'service';
  quantity: number;
  unitPrice: number;
  commissionRate: number;
  date: string;
}

export interface CommissionTracker {
  weeklyTotal: number;
  monthlyTotal: number;
  yearlyTotal: number;
  weeklyGoal: number;
  monthlyGoal: number;
  recentItems: CommissionItem[];
}

export const mockCommissionTracker: CommissionTracker = {
  weeklyTotal: 0,
  monthlyTotal: 0,
  yearlyTotal: 0,
  weeklyGoal: 0,
  monthlyGoal: 0,
  recentItems: [],
};
