export type UserRole = 'repair_tech' | 'service_tech' | 'supervisor' | 'repair_foreman';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'residential' | 'commercial' | 'municipal';
  gateCode?: string;
  contactName: string;
  contactPhone: string;
  notes?: string;
  poolCount: number;
}

export interface RouteStop {
  id: string;
  propertyId: string;
  property: Property;
  technicianId: string;
  scheduledTime: string;
  order: number;
  completed: boolean;
}

export interface Job {
  id: string;
  propertyId: string;
  property: Property;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  photos: string[];
  scheduledTime?: string;
  order: number;
  createdAt: string;
}

export interface EstimateItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  propertyId: string;
  property: Property;
  technicianId: string;
  status: 'draft' | 'sent' | 'approved' | 'declined';
  items: EstimateItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}

export interface FieldEntry {
  id: string;
  propertyId: string;
  technicianId: string;
  type: 'service' | 'repair' | 'inspection' | 'note';
  notes: string;
  photos: string[];
  createdAt: string;
}

export interface IssueReport {
  propertyId: string;
  issueType: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  photos: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isUser: boolean;
}

export interface QueueMetrics {
  myEstimates: number;
  urgentJobs: number;
  partsOrdered: number;
  completed: number;
}
