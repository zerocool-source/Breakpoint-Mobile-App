/**
 * Tech Ops Service - Handles all tech ops API calls
 * Connects Mobile App to API v2 for field-to-office submissions
 */

import { apiRequest } from './query-client';

// Entry types matching API v2
export type TechOpsEntryType =
  | 'repairs_needed'
  | 'service_repairs'
  | 'chemical_order'
  | 'chemicals_dropoff'
  | 'windy_day_cleanup'
  | 'report_issue'
  | 'supervisor_concerns'
  | 'add_notes';

export type TechOpsPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TechOpsStatus =
  | 'pending'
  | 'in_progress'
  | 'reviewed'
  | 'resolved'
  | 'completed'
  | 'cancelled'
  | 'archived'
  | 'dismissed';

export interface TechOpsEntry {
  id: string;
  entryType: TechOpsEntryType;
  technicianName?: string;
  technicianId?: string;
  positionType?: string;
  propertyId?: string;
  propertyName?: string;
  propertyAddress?: string;
  issueTitle?: string;
  description?: string;
  notes?: string;
  priority: TechOpsPriority;
  status: TechOpsStatus;
  isRead: boolean;
  chemicals?: string;
  quantity?: string;
  issueType?: string;
  photos: string[];
  vendorId?: string;
  vendorName?: string;
  orderStatus?: string;
  partsCost?: number;
  commissionPercent?: number;
  commissionAmount?: number;
  convertedToEstimateId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTechOpsEntryData {
  entryType: TechOpsEntryType;
  technicianName?: string;
  technicianId?: string;
  positionType?: string;
  propertyId?: string;
  propertyName?: string;
  propertyAddress?: string;
  issueTitle?: string;
  description?: string;
  notes?: string;
  priority?: TechOpsPriority;
  chemicals?: string;
  quantity?: string;
  issueType?: string;
  photos?: string[];
  vendorId?: string;
  vendorName?: string;
  partsCost?: number;
}

/**
 * Create a new tech ops entry (repairs_needed, chemical_order, etc.)
 */
export async function createTechOpsEntry(data: CreateTechOpsEntryData): Promise<TechOpsEntry> {
  const response = await apiRequest('POST', '/api/tech-ops', data);
  return response.json();
}

/**
 * Get all tech ops entries with optional filters
 */
export async function getTechOpsEntries(filters?: {
  entryType?: TechOpsEntryType;
  status?: TechOpsStatus;
  priority?: TechOpsPriority;
  propertyId?: string;
}): Promise<TechOpsEntry[]> {
  const params = new URLSearchParams();
  if (filters?.entryType) params.append('entryType', filters.entryType);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.propertyId) params.append('propertyId', filters.propertyId);

  const queryString = params.toString();
  const url = queryString ? `/api/tech-ops?${queryString}` : '/api/tech-ops';

  const response = await apiRequest('GET', url);
  return response.json();
}

/**
 * Get a single tech ops entry by ID
 */
export async function getTechOpsEntry(id: string): Promise<TechOpsEntry> {
  const response = await apiRequest('GET', `/api/tech-ops/${id}`);
  return response.json();
}

/**
 * Update a tech ops entry
 */
export async function updateTechOpsEntry(
  id: string,
  data: Partial<TechOpsEntry>
): Promise<TechOpsEntry> {
  const response = await apiRequest('PATCH', `/api/tech-ops/${id}`, data);
  return response.json();
}

// ============================================
// Convenience functions for specific entry types
// ============================================

/**
 * Submit a "Repairs Needed" entry
 */
export async function submitRepairsNeeded(data: {
  propertyId?: string;
  propertyName: string;
  propertyAddress?: string;
  technicianName: string;
  technicianId?: string;
  description: string;
  isUrgent?: boolean;
  photos?: string[];
}): Promise<TechOpsEntry> {
  return createTechOpsEntry({
    entryType: 'repairs_needed',
    positionType: 'service_technician',
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    propertyAddress: data.propertyAddress,
    technicianName: data.technicianName,
    technicianId: data.technicianId,
    description: data.description,
    priority: data.isUrgent ? 'urgent' : 'normal',
    photos: data.photos,
  });
}

/**
 * Submit a "Service Repair" entry (tech completed a small repair)
 */
export async function submitServiceRepair(data: {
  propertyId?: string;
  propertyName: string;
  propertyAddress?: string;
  technicianName: string;
  technicianId?: string;
  description: string;
  partsCost?: number;
  photos?: string[];
}): Promise<TechOpsEntry> {
  return createTechOpsEntry({
    entryType: 'service_repairs',
    positionType: 'service_technician',
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    propertyAddress: data.propertyAddress,
    technicianName: data.technicianName,
    technicianId: data.technicianId,
    description: data.description,
    partsCost: data.partsCost,
    photos: data.photos,
  });
}

/**
 * Submit a "Chemical Order" entry
 */
export async function submitChemicalOrder(data: {
  propertyId?: string;
  propertyName: string;
  propertyAddress?: string;
  technicianName: string;
  technicianId?: string;
  chemicals: string;
  quantity?: string;
  notes?: string;
  isUrgent?: boolean;
}): Promise<TechOpsEntry> {
  return createTechOpsEntry({
    entryType: 'chemical_order',
    positionType: 'service_technician',
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    propertyAddress: data.propertyAddress,
    technicianName: data.technicianName,
    technicianId: data.technicianId,
    chemicals: data.chemicals,
    quantity: data.quantity,
    notes: data.notes,
    priority: data.isUrgent ? 'urgent' : 'normal',
  });
}

/**
 * Submit a "Chemicals Dropped Off" entry
 */
export async function submitChemicalsDropoff(data: {
  propertyId?: string;
  propertyName: string;
  propertyAddress?: string;
  technicianName: string;
  technicianId?: string;
  chemicals: string;
  quantity?: string;
  notes?: string;
  photos?: string[];
}): Promise<TechOpsEntry> {
  return createTechOpsEntry({
    entryType: 'chemicals_dropoff',
    positionType: 'service_technician',
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    propertyAddress: data.propertyAddress,
    technicianName: data.technicianName,
    technicianId: data.technicianId,
    chemicals: data.chemicals,
    quantity: data.quantity,
    notes: data.notes,
    photos: data.photos,
  });
}

/**
 * Submit a "Windy Day Cleanup" entry
 */
export async function submitWindyDayCleanup(data: {
  propertyId?: string;
  propertyName: string;
  propertyAddress?: string;
  technicianName: string;
  technicianId?: string;
  description: string;
  partsCost?: number;
  photos?: string[];
}): Promise<TechOpsEntry> {
  return createTechOpsEntry({
    entryType: 'windy_day_cleanup',
    positionType: 'service_technician',
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    propertyAddress: data.propertyAddress,
    technicianName: data.technicianName,
    technicianId: data.technicianId,
    description: data.description,
    partsCost: data.partsCost,
    photos: data.photos,
  });
}

/**
 * Submit a "Report Issue" entry
 */
export async function submitReportIssue(data: {
  propertyId?: string;
  propertyName: string;
  propertyAddress?: string;
  technicianName: string;
  technicianId?: string;
  issueTitle: string;
  issueType: string;
  description: string;
  isUrgent?: boolean;
  photos?: string[];
}): Promise<TechOpsEntry> {
  return createTechOpsEntry({
    entryType: 'report_issue',
    positionType: 'service_technician',
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    propertyAddress: data.propertyAddress,
    technicianName: data.technicianName,
    technicianId: data.technicianId,
    issueTitle: data.issueTitle,
    issueType: data.issueType,
    description: data.description,
    priority: data.isUrgent ? 'urgent' : 'normal',
    photos: data.photos,
  });
}

/**
 * Submit a "Supervisor Concerns" entry
 */
export async function submitSupervisorConcerns(data: {
  propertyId?: string;
  propertyName?: string;
  propertyAddress?: string;
  technicianName: string;
  technicianId?: string;
  issueTitle: string;
  description: string;
  isUrgent?: boolean;
  photos?: string[];
}): Promise<TechOpsEntry> {
  return createTechOpsEntry({
    entryType: 'supervisor_concerns',
    positionType: 'supervisor',
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    propertyAddress: data.propertyAddress,
    technicianName: data.technicianName,
    technicianId: data.technicianId,
    issueTitle: data.issueTitle,
    description: data.description,
    priority: data.isUrgent ? 'urgent' : 'normal',
    photos: data.photos,
  });
}

/**
 * Submit an "Add Notes" entry
 */
export async function submitAddNotes(data: {
  propertyId?: string;
  propertyName: string;
  propertyAddress?: string;
  technicianName: string;
  technicianId?: string;
  notes: string;
  photos?: string[];
}): Promise<TechOpsEntry> {
  return createTechOpsEntry({
    entryType: 'add_notes',
    positionType: 'service_technician',
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    propertyAddress: data.propertyAddress,
    technicianName: data.technicianName,
    technicianId: data.technicianId,
    notes: data.notes,
    photos: data.photos,
  });
}
