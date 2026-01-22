import type { User, Property, Job, Estimate, RouteStop, ChatMessage, QueueMetrics } from '@/types';

export const mockUser: User = {
  id: '',
  name: '',
  email: '',
  role: 'repair_tech',
};

export const mockProperties: Property[] = [];

export const mockJobs: Job[] = [];

export const mockEstimates: Estimate[] = [];

export const mockRouteStops: RouteStop[] = [];

export const mockChatMessages: ChatMessage[] = [];

export const mockQueueMetrics: QueueMetrics = {
  myEstimates: 0,
  urgentJobs: 0,
  partsOrdered: 0,
  completed: 0,
};

export function generateEstimateNumber(): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `EST-${year}${month}-${seq}`;
}

export const mockCustomers: { id: string; name: string; email: string; pools?: number; status?: string; phone?: string }[] = [];

export interface SupportiveAction {
  id: string;
  technicianId: string;
  technicianName: string;
  date: string;
  category: 'performance' | 'behavior' | 'safety' | 'attendance' | 'quality';
  severity: 'low' | 'medium' | 'high';
  issueDescription: string;
  actionPlan: string;
  followUpDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  photos?: string[];
}

export const mockSupportiveActions: SupportiveAction[] = [];

export interface TruckInspection {
  id: string;
  truckNumber: string;
  inspectionDate: string;
  technicianId: string;
  technicianName: string;
  mileage: number;
  fuelLevel: 'empty' | 'quarter' | 'half' | 'three_quarter' | 'full';
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  damageMarks: DamageMark[];
  checklist: TruckChecklistItem[];
  notes: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface DamageMark {
  id: string;
  view: 'front' | 'rear' | 'driver_side' | 'cargo';
  x: number;
  y: number;
  type: 'dent' | 'scratch' | 'crack' | 'missing' | 'rust' | 'other';
  notes?: string;
}

export interface TruckChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export const truckChecklistItems: TruckChecklistItem[] = [
  { id: '1', label: 'Headlights working', checked: false },
  { id: '2', label: 'Tail lights working', checked: false },
  { id: '3', label: 'Turn signals working', checked: false },
  { id: '4', label: 'Brake lights working', checked: false },
  { id: '5', label: 'Windshield clean/undamaged', checked: false },
  { id: '6', label: 'Mirrors adjusted and clean', checked: false },
  { id: '7', label: 'Tires in good condition', checked: false },
  { id: '8', label: 'Tire pressure checked', checked: false },
  { id: '9', label: 'Oil level checked', checked: false },
  { id: '10', label: 'Coolant level checked', checked: false },
  { id: '11', label: 'Washer fluid filled', checked: false },
  { id: '12', label: 'Brakes functioning properly', checked: false },
  { id: '13', label: 'Horn working', checked: false },
  { id: '14', label: 'Safety equipment present', checked: false },
  { id: '15', label: 'First aid kit present', checked: false },
  { id: '16', label: 'Fire extinguisher present', checked: false },
];

export const mockTruckInspections: TruckInspection[] = [];

export const mockActiveTechnicians: { id: string; name: string; role: string; status: string; location: string; lastUpdate: string }[] = [];

export interface QuickRepair {
  id: string;
  propertyName: string;
  address: string;
  description: string;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  status: 'unassigned' | 'claimed' | 'in_progress' | 'completed';
  assignedTo?: string;
  dueDate: string;
  createdAt: string;
}

export const mockQuickRepairs: QuickRepair[] = [];

export interface DemoNotification {
  id: string;
  role: 'service_tech' | 'supervisor' | 'repair_tech';
  title: string;
  message: string;
  type: 'urgent' | 'warning' | 'info';
  icon: string;
  timestamp: string;
}

export const mockDemoNotifications: DemoNotification[] = [];
