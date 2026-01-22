export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export const inspectionChecklist: ChecklistCategory[] = [
  {
    id: 'access',
    name: '1. Complete Inspection Access',
    items: [
      { id: 'access_1', label: 'Skimmer lid stuck', category: 'access' },
      { id: 'access_2', label: 'Entrance to pool site enclosure locked', category: 'access' },
      { id: 'access_3', label: 'Equipment room/area locked', category: 'access' },
    ],
  },
  {
    id: 'water_quality',
    name: '2. Water Quality',
    items: [
      { id: 'wq_1', label: 'Provide keys', category: 'water_quality' },
      { id: 'wq_2', label: 'Maintain pH 7.2 - 7.8', category: 'water_quality' },
      { id: 'wq_3', label: 'Free chlorine (Pools) - 1.0 ppm min (w/o stabilizer) or 2.0 ppm min (w/ stabilizer); max 10 ppm', category: 'water_quality' },
      { id: 'wq_4', label: 'Free chlorine (Spas/Spray Grounds) - 3.0 ppm min; max 10 ppm', category: 'water_quality' },
      { id: 'wq_5', label: 'UV disinfection for spray grounds', category: 'water_quality' },
      { id: 'wq_6', label: 'Cyanuric acid ≤ 100 ppm', category: 'water_quality' },
      { id: 'wq_7', label: 'Water clarity', category: 'water_quality' },
      { id: 'wq_8', label: 'Water test kit', category: 'water_quality' },
      { id: 'wq_9', label: 'Daily log (2 years)', category: 'water_quality' },
      { id: 'wq_10', label: 'Spa temperature ≤ 104°F', category: 'water_quality' },
      { id: 'wq_11', label: 'Backwash air gap (1")', category: 'water_quality' },
    ],
  },
  {
    id: 'enclosure',
    name: '3. Enclosure & Fencing',
    items: [
      { id: 'enc_1', label: 'Self-closing/latching gates', category: 'enclosure' },
      { id: 'enc_2', label: '5 ft. fencing with ≤ 4 in. gaps', category: 'enclosure' },
      { id: 'enc_3', label: 'Enclosure in good repair', category: 'enclosure' },
      { id: 'enc_4', label: 'No animals in pool area', category: 'enclosure' },
    ],
  },
  {
    id: 'shell',
    name: '4. Shell & Facility Components',
    items: [
      { id: 'shell_1', label: 'Shell condition', category: 'shell' },
      { id: 'shell_2', label: 'Decking & coping', category: 'shell' },
      { id: 'shell_3', label: 'Tiles', category: 'shell' },
      { id: 'shell_4', label: 'Depth & "No Diving" markers', category: 'shell' },
      { id: 'shell_5', label: 'Ladders, rails, steps', category: 'shell' },
      { id: 'shell_6', label: 'Light fixtures', category: 'shell' },
      { id: 'shell_7', label: 'Deck clearance', category: 'shell' },
      { id: 'shell_8', label: 'Hose bibs & backflow', category: 'shell' },
    ],
  },
  {
    id: 'restrooms',
    name: '5. Restrooms / Showers / Dressing Rooms',
    items: [
      { id: 'rest_1', label: 'Showers & dressing areas', category: 'restrooms' },
      { id: 'rest_2', label: 'Toilets & sinks', category: 'restrooms' },
      { id: 'rest_3', label: 'Soap & paper towels', category: 'restrooms' },
      { id: 'rest_4', label: 'Drinking fountains', category: 'restrooms' },
    ],
  },
  {
    id: 'recirculation',
    name: '6. Recirculation Equipment',
    items: [
      { id: 'recirc_1', label: 'Pump(s)', category: 'recirculation' },
      { id: 'recirc_2', label: 'Gauges & flowmeters', category: 'recirculation' },
      { id: 'recirc_3', label: 'Filters', category: 'recirculation' },
      { id: 'recirc_4', label: 'Chlorinator(s)', category: 'recirculation' },
      { id: 'recirc_5', label: 'Skimmers', category: 'recirculation' },
      { id: 'recirc_6', label: 'Main drain covers', category: 'recirculation' },
      { id: 'recirc_7', label: 'Labeling & flow direction', category: 'recirculation' },
    ],
  },
  {
    id: 'circulation_control',
    name: '7. Water Circulation Control',
    items: [
      { id: 'circ_1', label: 'Water level at skimmer midpoint', category: 'circulation_control' },
      { id: 'circ_2', label: 'Equipment area access restricted', category: 'circulation_control' },
    ],
  },
  {
    id: 'safety',
    name: '8. Safety Equipment & Signage',
    items: [
      { id: 'safety_1', label: '"NO LIFEGUARD" sign', category: 'safety' },
      { id: 'safety_2', label: '"NO DIVING" sign', category: 'safety' },
      { id: 'safety_3', label: 'CPR diagram (¼ in. letters)', category: 'safety' },
      { id: 'safety_4', label: '911 emergency number', category: 'safety' },
      { id: 'safety_5', label: 'Nearest emergency service number', category: 'safety' },
      { id: 'safety_6', label: 'Pool name & address sign', category: 'safety' },
      { id: 'safety_7', label: 'Maximum bather load', category: 'safety' },
      { id: 'safety_8', label: 'Spa warning & caution rules', category: 'safety' },
      { id: 'safety_9', label: '"Keep Closed" gate sign', category: 'safety' },
      { id: 'safety_10', label: 'Diarrhea prohibited sign', category: 'safety' },
      { id: 'safety_11', label: 'Life ring + rope', category: 'safety' },
      { id: 'safety_12', label: 'Rescue pole (12 ft.)', category: 'safety' },
      { id: 'safety_13', label: 'Spa shut-off switch', category: 'safety' },
      { id: 'safety_14', label: 'Shut-off switch label', category: 'safety' },
      { id: 'safety_15', label: 'Anti-entrapment device', category: 'safety' },
    ],
  },
  {
    id: 'employees',
    name: '9. Employees & Incident Response',
    items: [
      { id: 'emp_1', label: 'Employee health', category: 'employees' },
      { id: 'emp_2', label: 'Diarrhea incident report', category: 'employees' },
      { id: 'emp_3', label: 'Contamination/drowning log', category: 'employees' },
      { id: 'emp_4', label: 'Lifeguard credentials & duties', category: 'employees' },
      { id: 'emp_5', label: 'Lifeguard equipment', category: 'employees' },
    ],
  },
  {
    id: 'closure',
    name: '10. Closure Conditions',
    items: [
      { id: 'close_1', label: 'No disinfectant', category: 'closure' },
      { id: 'close_2', label: 'Algae growth', category: 'closure' },
      { id: 'close_3', label: 'Water clarity failure', category: 'closure' },
      { id: 'close_4', label: 'Missing/damaged main drain covers', category: 'closure' },
      { id: 'close_5', label: 'Underwater light hazard', category: 'closure' },
      { id: 'close_6', label: 'Health/safety threat', category: 'closure' },
      { id: 'close_7', label: '"Closed" signs posted', category: 'closure' },
    ],
  },
];

export const getTotalChecklistItems = (): number => {
  return inspectionChecklist.reduce((total, category) => total + category.items.length, 0);
};

export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface QCInspection {
  id: string;
  title: string;
  propertyName: string;
  propertyAddress: string;
  inspector: string;
  inspectorRole: 'supervisor' | 'technician';
  date: string;
  status: InspectionStatus;
  completedItems: number;
  totalItems: number;
  notes?: string;
  checkedItems?: string[];
}

export const mockQCInspections: QCInspection[] = [
  {
    id: 'insp_001',
    title: 'Monthly QC Inspection',
    propertyName: 'Sunny Mead HOA',
    propertyAddress: '1234 Pool Lane, Phoenix AZ',
    inspector: 'John Martinez',
    inspectorRole: 'supervisor',
    date: '2026-01-22',
    status: 'completed',
    completedItems: 63,
    totalItems: 63,
  },
  {
    id: 'insp_002',
    title: 'Quarterly Safety Audit',
    propertyName: 'Desert Springs Resort',
    propertyAddress: '5678 Resort Blvd, Scottsdale AZ',
    inspector: 'Mike Thompson',
    inspectorRole: 'technician',
    date: '2026-01-21',
    status: 'completed',
    completedItems: 63,
    totalItems: 63,
  },
  {
    id: 'insp_003',
    title: 'Weekly Pool Check',
    propertyName: 'Oakwood Apartments',
    propertyAddress: '910 Oak Street, Mesa AZ',
    inspector: 'Sarah Chen',
    inspectorRole: 'technician',
    date: '2026-01-20',
    status: 'in_progress',
    completedItems: 42,
    totalItems: 63,
  },
  {
    id: 'insp_004',
    title: 'Pre-Season Inspection',
    propertyName: 'Valley View Community',
    propertyAddress: '2345 Valley Road, Gilbert AZ',
    inspector: 'John Martinez',
    inspectorRole: 'supervisor',
    date: '2026-01-19',
    status: 'completed',
    completedItems: 63,
    totalItems: 63,
  },
  {
    id: 'insp_005',
    title: 'New Property Evaluation',
    propertyName: 'Sunrise Condos',
    propertyAddress: '789 Sunrise Ave, Tempe AZ',
    inspector: 'David Wilson',
    inspectorRole: 'technician',
    date: '2026-01-18',
    status: 'failed',
    completedItems: 55,
    totalItems: 63,
    notes: '8 critical items failed - main drain covers damaged',
  },
  {
    id: 'insp_006',
    title: 'Follow-up Inspection',
    propertyName: 'Palm Gardens',
    propertyAddress: '456 Palm Drive, Chandler AZ',
    inspector: 'Emily Rodriguez',
    inspectorRole: 'technician',
    date: '2026-01-17',
    status: 'pending',
    completedItems: 0,
    totalItems: 63,
  },
];
