import { Route, FileText, ShieldCheck, Package, ShoppingCart, Settings } from 'lucide-react';

export type PermissionItem = {
  id: string;
  label: string;
};

export type ModuleConfig = {
  id: string;
  name: string;
  icon: any;
  permissions: PermissionItem[];
};

// Centralized modules and their available permissions
// Tune labels/ids as needed to match backend naming
export const MODULES_CONFIG: ModuleConfig[] = [
  {
    id: 'track_and_trace',
    name: 'Track & Trace',
    icon: Route,
    permissions: [{ id: 'can_view_tracking', label: 'Can View Tracking' }]
  },
  {
    id: 'application_forms',
    name: 'Application Forms',
    icon: FileText,
    permissions: [
      { id: 'can_manage_all_forms', label: 'Can Manage All Forms' },
      { id: 'can_approve', label: 'Can Approve' },
      { id: 'can_assign_inspector', label: 'Can Assign Inspector' },
      { id: 'can_reject', label: 'Can Reject' },
      { id: 'can_halt', label: 'Can Halt' },
      { id: 'can_view_sr4_forms', label: 'Can View SR4 Forms' },
      { id: 'can_create_sr4_forms', label: 'Can Create SR4 Forms' },
      { id: 'can_edit_sr4_forms', label: 'Can Edit SR4 Forms' },
      { id: 'can_delete_sr4_forms', label: 'Can Delete SR4 Forms' },
      { id: 'can_view_sr6_forms', label: 'Can View SR6 Forms' },
      { id: 'can_create_sr6_forms', label: 'Can Create SR6 Forms' },
      { id: 'can_edit_sr6_forms', label: 'Can Edit SR6 Forms' },
      { id: 'can_delete_sr6_forms', label: 'Can Delete SR6 Forms' },
      { id: 'can_view_qds_forms', label: 'Can View QDS Forms' },
      { id: 'can_create_qds_forms', label: 'Can Create QDS Forms' },
      { id: 'can_edit_qds_forms', label: 'Can Edit QDS Forms' },
      { id: 'can_delete_qds_forms', label: 'Can Delete QDS Forms' }
    ]
  },
  {
    id: 'quality_assurance',
    name: 'Quality Assurance',
    icon: ShieldCheck,
    permissions: [
      { id: 'can_manage_all_qa_tasks', label: 'Can Manage ALL QA Tasks' },
      { id: 'can_view_field_inspections', label: 'Can View Field Inspections' },
      { id: 'can_edit_field_inspections', label: 'Can Edit Field Inspections' },
      { id: 'can_delete_field_inspections', label: 'Can Delete Field Inspections' }
    ]
  },
  {
    id: 'seed_stock',
    name: 'Seed Stock',
    icon: Package,
    permissions: []
  },
  {
    id: 'market_place',
    name: 'Market Place',
    icon: ShoppingCart,
    permissions: []
  },
  {
    id: 'system_configuration',
    name: 'System Configuration',
    icon: Settings,
    permissions: [
      { id: 'can_create_users', label: 'Can Create Users' },
      { id: 'can_view_settings', label: 'Can View Settings' },
      { id: 'can_manage_users', label: 'Can Manage Users' },
      { id: 'can_manage_roles', label: 'Can Manage Users' }
    ]
  }
];
