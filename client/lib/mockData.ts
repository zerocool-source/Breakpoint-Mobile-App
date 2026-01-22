import type { User, Property, Job, Estimate, RouteStop, ChatMessage, QueueMetrics } from '@/types';

export const mockUser: User = {
  id: '1',
  name: 'Mike Johnson',
  email: 'mike@breakpoint.com',
  role: 'repair_tech',
};

export const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Sunset Valley Resort',
    address: '1234 Sunset Blvd, Phoenix, AZ 85001',
    type: 'commercial',
    gateCode: '4521',
    contactName: 'Sarah Martinez',
    contactPhone: '(602) 555-0123',
    notes: 'Main entrance by the lobby',
    poolCount: 3,
  },
  {
    id: '2',
    name: 'Desert Springs HOA',
    address: '5678 Palm Drive, Scottsdale, AZ 85251',
    type: 'residential',
    gateCode: '1234',
    contactName: 'John Smith',
    contactPhone: '(480) 555-0456',
    notes: 'Community pool behind clubhouse',
    poolCount: 2,
  },
  {
    id: '3',
    name: 'Aqua Fitness Center',
    address: '910 Health Way, Tempe, AZ 85281',
    type: 'commercial',
    contactName: 'Lisa Chen',
    contactPhone: '(480) 555-0789',
    poolCount: 4,
  },
  {
    id: '4',
    name: 'City Municipal Pool',
    address: '321 Civic Center, Mesa, AZ 85201',
    type: 'municipal',
    contactName: 'Robert Davis',
    contactPhone: '(480) 555-0321',
    notes: 'Check in at front desk',
    poolCount: 1,
  },
];

export const mockJobs: Job[] = [
  {
    id: '1',
    propertyId: '1',
    property: mockProperties[0],
    title: 'Pump Replacement',
    description: 'Main circulation pump making noise, needs replacement',
    priority: 'high',
    status: 'pending',
    photos: [],
    scheduledTime: '09:00 AM',
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    propertyId: '2',
    property: mockProperties[1],
    title: 'Filter Cleaning',
    description: 'Routine filter maintenance and cleaning',
    priority: 'normal',
    status: 'pending',
    photos: [],
    scheduledTime: '11:00 AM',
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    propertyId: '3',
    property: mockProperties[2],
    title: 'Heater Inspection',
    description: 'Annual heater inspection and testing',
    priority: 'low',
    status: 'in_progress',
    photos: [],
    scheduledTime: '02:00 PM',
    order: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    propertyId: '4',
    property: mockProperties[3],
    title: 'Emergency Leak Repair',
    description: 'Water leak detected in pump room',
    priority: 'urgent',
    status: 'pending',
    photos: [],
    scheduledTime: '04:00 PM',
    order: 4,
    createdAt: new Date().toISOString(),
  },
];

export const mockEstimates: Estimate[] = [
  {
    id: '1',
    estimateNumber: 'EST-2501-0001',
    propertyId: '1',
    property: mockProperties[0],
    technicianId: '1',
    status: 'sent',
    items: [
      { id: '1', description: 'Variable Speed Pool Pump', quantity: 1, rate: 1299.99, amount: 1299.99 },
      { id: '2', description: 'Installation Labor', quantity: 4, rate: 95.00, amount: 380.00 },
      { id: '3', description: 'Plumbing Fittings', quantity: 1, rate: 85.00, amount: 85.00 },
    ],
    subtotal: 1764.99,
    tax: 158.85,
    total: 1923.84,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '2',
    estimateNumber: 'EST-2501-0002',
    propertyId: '2',
    property: mockProperties[1],
    technicianId: '1',
    status: 'approved',
    items: [
      { id: '1', description: 'Pool Filter Cartridge', quantity: 4, rate: 89.99, amount: 359.96 },
      { id: '2', description: 'Filter Service', quantity: 2, rate: 75.00, amount: 150.00 },
    ],
    subtotal: 509.96,
    tax: 45.90,
    total: 555.86,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: '3',
    estimateNumber: 'EST-2501-0003',
    propertyId: '3',
    property: mockProperties[2],
    technicianId: '1',
    status: 'draft',
    items: [
      { id: '1', description: 'Pool Heater Unit', quantity: 1, rate: 2499.00, amount: 2499.00 },
      { id: '2', description: 'Gas Line Connection', quantity: 1, rate: 350.00, amount: 350.00 },
      { id: '3', description: 'Installation Labor', quantity: 6, rate: 95.00, amount: 570.00 },
    ],
    subtotal: 3419.00,
    tax: 307.71,
    total: 3726.71,
    createdAt: new Date().toISOString(),
  },
];

export const mockRouteStops: RouteStop[] = mockProperties.slice(0, 3).map((property, index) => ({
  id: String(index + 1),
  propertyId: property.id,
  property,
  technicianId: '1',
  scheduledTime: ['09:00 AM', '11:00 AM', '02:00 PM'][index],
  order: index + 1,
  completed: index === 0,
}));

export const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    senderId: 'support',
    content: 'Hi Mike! How can I help you today?',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isUser: false,
  },
  {
    id: '2',
    senderId: '1',
    content: 'I need help with a pump installation at Sunset Valley.',
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    isUser: true,
  },
  {
    id: '3',
    senderId: 'support',
    content: 'Sure! What specific issue are you experiencing with the installation?',
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    isUser: false,
  },
];

export const mockQueueMetrics: QueueMetrics = {
  myEstimates: 3,
  urgentJobs: 1,
  partsOrdered: 2,
  completed: 8,
};

export function generateEstimateNumber(): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `EST-${year}${month}-${seq}`;
}

// Customer data for Supervisor role
export const mockCustomers = [
  { id: '1', name: 'AVELINA HOA', email: 'pro.invoices@associa.us', pools: 4, status: 'Active' },
  { id: '2', name: 'Altis Master Association', email: 'jason.kratz@seabreezemgmt.com', pools: 7, status: 'Active' },
  { id: '3', name: 'Amberwalk HOA', email: 'hoavendor@wsr.net', pools: 3, status: 'Active' },
  { id: '4', name: 'Amelia Square HOA', email: 'jwilliams@prescottmgt.com', pools: 3, status: 'Active' },
  { id: '5', name: 'Antelope Ridge Apartments', email: 'anteloperidges@sentinelcorp.com', pools: 1, status: 'Active' },
  { id: '6', name: 'Antigua - Repairs', email: 'caterina.mares@fsresidential.com', pools: 2, status: 'Active' },
  { id: '7', name: 'Arrow Station HOA', email: 'seabreezeinvoices@payableslockbox.com', pools: 2, status: 'Active' },
  { id: '8', name: 'Aspen Hills - Repair', email: 'LKridle@5starmgmt.com', pools: 2, status: 'Active' },
  { id: '9', name: 'Atwell Community Association PA-22', email: 'stephanie.schumann@seabreezemgmt.com', pools: 3, status: 'Active' },
  { id: '10', name: 'Audie Murphy Ranch HOA', email: 'AccountsPayable@Keystonepacific.com', pools: 6, status: 'Active' },
  { id: '11', name: 'Bear Creek MA', email: 'ap@avalonweb.com', phone: '(800) 400-2284', pools: 5, status: 'Active' },
  { id: '12', name: 'Bedford Master Association', email: 'deanna.casillas@fsresidential.com', pools: 5, status: 'Active' },
  { id: '13', name: 'Bella Vista HOA', email: 'reina@cmsmgmt.com', pools: 4, status: 'Active' },
  { id: '14', name: 'Bottaia Winery', email: 'jhilton@pontewinery.com', phone: '(951) 397-1300', pools: 1, status: 'Active' },
  { id: '15', name: 'Breakpoint Commercial Pools (Test)', email: 'breakpointcpsinc@gmail.com', phone: '(951) 653-3333', pools: 4, status: 'Active' },
  { id: '16', name: 'Bridlevale HOA', email: 'blake@avalonweb.com', pools: 4, status: 'Active' },
  { id: '17', name: 'Brookfield Ontario Ranch MA', email: 'proinvoices@associa.us', pools: 11, status: 'Active' },
  { id: '18', name: 'Carter Estates Winery & Resort', email: 'cibarra@wineresort.com', phone: '(858) 248-7185', pools: 2, status: 'Active' },
  { id: '19', name: 'Cornerstone HOA', email: 'anyssa.sanchez@fsresidential.com', pools: 3, status: 'Active' },
  { id: '20', name: 'Cottonwood Canyon Hills HOA', email: 'ccastro@actionlife.com', phone: '(951) 246-2397', pools: 8, status: 'Active' },
  { id: '21', name: 'Dakota Apartments', email: 'manager@rent-dakota.com', phone: '(951) 926-8200', pools: 3, status: 'Active' },
  { id: '22', name: 'EOS Fitness Moreno Valley', email: 'Hannibalmartinez12@gmail.com', pools: 1, status: 'Active' },
  { id: '23', name: 'Esperanza HOA', email: 'dharle@keystonepacific.com', pools: 4, status: 'Active' },
  { id: '24', name: 'Fairway Canyon HOA', email: 'Brittany.Bishop@fsresidential.com', pools: 5, status: 'Active' },
  { id: '25', name: 'Four Seasons at Hemet HOA', email: 'FSResidentialAPCA@avidbill.com', pools: 8, status: 'Active' },
  { id: '26', name: 'Grand Park Community Association', email: 'jscott@powerstonepm.com', pools: 4, status: 'Active' },
  { id: '27', name: 'Green River HOA', email: 'marc.m@avalon.web', pools: 5, status: 'Active' },
  { id: '28', name: 'Heritage Lake HOA', email: 'FSResidentialAPCA@avidbill.com', pools: 5, status: 'Active' },
  { id: '29', name: 'Horse Creek Ridge HOA', email: 'jeff@vintagegroupre.com', phone: '(760) 363-4811', pools: 4, status: 'Active' },
  { id: '30', name: 'Horsethief Canyon Ranch MA', email: 'seabreezeinvoices@payableslockbox.com', pools: 6, status: 'Active' },
];

// Supportive Actions data
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

export const mockSupportiveActions: SupportiveAction[] = [
  {
    id: '1',
    technicianId: '1',
    technicianName: 'Marcus Chen',
    date: '2026-01-21',
    category: 'performance',
    severity: 'medium',
    issueDescription: 'Missed chemical readings at two properties',
    actionPlan: 'Review proper testing procedures and shadow senior tech for 3 days',
    followUpDate: '2026-01-28',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    technicianId: '2',
    technicianName: 'Sarah Wilson',
    date: '2026-01-18',
    category: 'attendance',
    severity: 'low',
    issueDescription: 'Late arrival to first property twice this week',
    actionPlan: 'Discussed importance of punctuality, tech acknowledged and committed to improvement',
    followUpDate: '2026-01-25',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

// Truck Inspection data
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

export const mockTruckInspections: TruckInspection[] = [
  {
    id: '1',
    truckNumber: 'T-101',
    inspectionDate: '2026-01-21',
    technicianId: '1',
    technicianName: 'Marcus Chen',
    mileage: 45230,
    fuelLevel: 'three_quarter',
    overallCondition: 'good',
    damageMarks: [],
    checklist: truckChecklistItems.map(item => ({ ...item, checked: true })),
    notes: 'Minor scratches on rear bumper from previous week',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Active technicians (who's on)
export const mockActiveTechnicians = [
  { id: '1', name: 'Marcus Chen', role: 'service', status: 'active', location: 'Sunset Valley Resort', lastUpdate: new Date(Date.now() - 300000).toISOString() },
  { id: '2', name: 'Sarah Wilson', role: 'service', status: 'active', location: 'Desert Springs HOA', lastUpdate: new Date(Date.now() - 600000).toISOString() },
  { id: '3', name: 'James Rodriguez', role: 'repair', status: 'active', location: 'En Route', lastUpdate: new Date(Date.now() - 120000).toISOString() },
  { id: '4', name: 'Emily Davis', role: 'service', status: 'break', location: 'Aqua Fitness Center', lastUpdate: new Date(Date.now() - 900000).toISOString() },
  { id: '5', name: 'Michael Thompson', role: 'repair', status: 'offline', location: 'Last: City Municipal Pool', lastUpdate: new Date(Date.now() - 3600000).toISOString() },
];

// Quick Repairs (Under $500) - Operations Manager assigned repairs
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

export const mockQuickRepairs: QuickRepair[] = [
  {
    id: 'qr1',
    propertyName: 'Ridgeview Apartments',
    address: '789 Ridge Ave, Vista, CA',
    description: 'Replace cracked skimmer baskets at community pool. All 4 skimmers need new baskets.',
    estimatedCost: 95,
    priority: 'low',
    status: 'unassigned',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'qr2',
    propertyName: 'Ocean Breeze Resort',
    address: '555 Pacific Dr, Carlsbad, CA',
    description: 'Fix leak in backwash line at DE filter. Pipe is cracked at joint.',
    estimatedCost: 175,
    priority: 'medium',
    status: 'unassigned',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'qr3',
    propertyName: 'Bayview Condos',
    address: '321 Harbor Blvd, Oceanside, CA',
    description: 'Replace broken automatic water leveler. Current unit is not maintaining proper water level.',
    estimatedCost: 245,
    priority: 'low',
    status: 'unassigned',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'qr4',
    propertyName: 'Palm Gardens HOA',
    address: '1200 Palm Canyon Dr, Rancho Mirage, CA',
    description: 'Replace worn gasket on main drain cover. Cover is loose and needs immediate attention.',
    estimatedCost: 85,
    priority: 'high',
    status: 'unassigned',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'qr5',
    propertyName: 'Sunset Valley Resort',
    address: '1234 Sunset Blvd, Phoenix, AZ',
    description: 'Replace pool light bulb in main pool. LED conversion recommended.',
    estimatedCost: 320,
    priority: 'medium',
    status: 'claimed',
    assignedTo: 'Mike Johnson',
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

// Demo notifications for each role
export interface DemoNotification {
  id: string;
  role: 'service_tech' | 'supervisor' | 'repair_tech';
  title: string;
  message: string;
  type: 'urgent' | 'warning' | 'info';
  icon: string;
  timestamp: string;
}

export const mockDemoNotifications: DemoNotification[] = [
  {
    id: 'dn1',
    role: 'service_tech',
    title: 'Urgent Pool Service Required',
    message: 'Sunset Valley Resort needs immediate attention - pool water is cloudy and guests are complaining.',
    type: 'urgent',
    icon: 'alert-circle',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'dn2',
    role: 'supervisor',
    title: 'Health Department Alert',
    message: 'Desert Springs HOA pool has been closed by the health department. Chlorine levels are below standard.',
    type: 'urgent',
    icon: 'alert-triangle',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'dn3',
    role: 'repair_tech',
    title: 'Emergency: Power Outage',
    message: 'Aqua Fitness Center - all pool equipment is offline due to power outage. Generator backup needed.',
    type: 'urgent',
    icon: 'zap-off',
    timestamp: new Date().toISOString(),
  },
];
