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

export const mockRouteStops: RouteStop[] = [];

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
