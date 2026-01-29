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
    id: 'demo-1',
    propertyName: 'Sunrise Apartments',
    address: '1250 Palm Valley Dr, Phoenix, AZ 85016',
    propertyType: 'Apartment',
    poolCount: 2,
    scheduledTime: '8:00 AM',
    completed: false,
    gateCode: '4521',
    contactName: 'Maria Rodriguez',
    contactPhone: '(602) 555-0142',
    notes: 'Main pool and kiddie pool. Check pump pressure.',
    bodiesOfWater: [
      { id: 'bow-1', name: 'Main Pool', location: 'Courtyard', type: 'pool', completed: false },
      { id: 'bow-2', name: 'Kiddie Pool', location: 'Playground area', type: 'pool', completed: false },
    ],
  },
  {
    id: 'demo-2',
    propertyName: 'Desert Ridge Resort & Spa',
    address: '5350 E Marriott Dr, Phoenix, AZ 85054',
    propertyType: 'Hotel',
    poolCount: 3,
    scheduledTime: '9:30 AM',
    completed: false,
    contactName: 'James Chen',
    contactPhone: '(480) 555-0198',
    notes: 'VIP property. Use service entrance on east side.',
    bodiesOfWater: [
      { id: 'bow-3', name: 'Main Resort Pool', location: 'Pool deck', type: 'pool', completed: false },
      { id: 'bow-4', name: 'Adults Only Pool', location: 'Rooftop', type: 'pool', completed: false },
      { id: 'bow-5', name: 'Spa Hot Tub', location: 'Spa building', type: 'spa', completed: false },
    ],
  },
  {
    id: 'demo-3',
    propertyName: 'Scottsdale HOA Community',
    address: '7890 N Hayden Rd, Scottsdale, AZ 85258',
    propertyType: 'HOA',
    poolCount: 1,
    scheduledTime: '11:00 AM',
    completed: false,
    gateCode: '9876#',
    contactName: 'Robert Thompson',
    contactPhone: '(480) 555-0167',
    notes: 'Community pool. Check chlorine levels - complaints last week.',
    bodiesOfWater: [
      { id: 'bow-6', name: 'Community Pool', location: 'Clubhouse', type: 'pool', completed: false },
    ],
  },
  {
    id: 'demo-4',
    propertyName: 'Pinnacle Corporate Center',
    address: '2900 N Central Ave, Phoenix, AZ 85012',
    propertyType: 'Commercial',
    poolCount: 2,
    scheduledTime: '1:00 PM',
    completed: false,
    contactName: 'Sandra Williams',
    contactPhone: '(602) 555-0234',
    notes: 'Executive pool and lobby fountain. Park in visitor lot.',
    bodiesOfWater: [
      { id: 'bow-7', name: 'Executive Pool', location: '3rd floor terrace', type: 'pool', completed: false },
      { id: 'bow-8', name: 'Lobby Fountain', location: 'Main entrance', type: 'fountain', completed: false },
    ],
  },
  {
    id: 'demo-5',
    propertyName: 'Camelback Village Apartments',
    address: '4455 E Camelback Rd, Phoenix, AZ 85018',
    propertyType: 'Apartment',
    poolCount: 2,
    scheduledTime: '2:30 PM',
    completed: false,
    gateCode: '1234*',
    contactName: 'Lisa Anderson',
    contactPhone: '(602) 555-0189',
    notes: 'Two pools - north and south buildings.',
    bodiesOfWater: [
      { id: 'bow-9', name: 'North Building Pool', location: 'North courtyard', type: 'pool', completed: false },
      { id: 'bow-10', name: 'South Building Pool', location: 'South courtyard', type: 'pool', completed: false },
    ],
  },
  {
    id: 'demo-6',
    propertyName: 'Paradise Valley Estates',
    address: '6200 E Lincoln Dr, Paradise Valley, AZ 85253',
    propertyType: 'HOA',
    poolCount: 1,
    scheduledTime: '4:00 PM',
    completed: false,
    gateCode: '5555',
    contactName: 'Michael Davis',
    contactPhone: '(480) 555-0156',
    notes: 'Luxury community. Pool and spa combo.',
    bodiesOfWater: [
      { id: 'bow-11', name: 'Estate Pool & Spa', location: 'Recreation center', type: 'pool', completed: false },
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
