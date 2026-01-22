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
