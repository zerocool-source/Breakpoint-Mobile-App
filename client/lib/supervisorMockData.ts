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

export const mockTechnicians: Technician[] = [];

export const mockTechnicianAssignmentStats: Record<string, TechnicianAssignmentStats> = {};

export interface TechnicianRouteStop {
  id: string;
  propertyName: string;
  address: string;
  status: 'completed' | 'in_progress' | 'pending' | 'skipped';
  scheduledTime: string;
}

export const mockTechnicianRoutes: Record<string, TechnicianRouteStop[]> = {};

export const mockQCInspections: QCInspection[] = [];

export const mockSupervisorAssignments: SupervisorAssignment[] = [];

export const mockProperties: Property[] = [];

export const mockWeeklyMetrics: WeeklyMetrics = {
  assignmentsCreated: 0,
  propertiesInspected: 0,
  pendingResponses: 0,
  qcInspections: 0,
};

export const supervisorInfo = {
  name: '',
  region: '',
  email: '',
  phone: '',
};
