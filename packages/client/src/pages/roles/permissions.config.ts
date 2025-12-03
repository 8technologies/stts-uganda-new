import {
  Route,
  FileText,
  ShieldCheck,
  Package,
  ShoppingCart,
  Settings,
} from "lucide-react";

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
    id: "track_and_trace",
    name: "Track & Trace",
    icon: Route,
    permissions: [{ id: "can_view_tracking", label: "Can View Tracking" }],
  },
  {
    id: "application_forms",
    name: "Application Forms",
    icon: FileText,
    permissions: [
      { id: "can_manage_all_forms", label: "Can Manage All Forms" },
      { id: "can_approve", label: "Can Approve" },
      { id: "can_assign_inspector", label: "Can Assign Inspector" },
      { id: "can_reject", label: "Can Reject" },
      { id: "can_halt", label: "Can Halt" },
      { id: "can_recommend", label: "Can Recommend" },
      {
        id: "can_view_specific_assigned_forms",
        label: "Can view specific assigned forms",
      },
      {
        id: "can_view_only_own_created_forms",
        label: "Can View Only Own Created Forms",
      },
      { id: "can_view_sr4_forms", label: "Can View SR4 Forms" },
      { id: "can_create_sr4_forms", label: "Can Create SR4 Forms" },
      { id: "can_edit_sr4_forms", label: "Can Edit SR4 Forms" },
      { id: "can_delete_sr4_forms", label: "Can Delete SR4 Forms" },
      { id: "can_view_sr6_forms", label: "Can View SR6 Forms" },
      { id: "can_create_sr6_forms", label: "Can Create SR6 Forms" },
      { id: "can_edit_sr6_forms", label: "Can Edit SR6 Forms" },
      { id: "can_delete_sr6_forms", label: "Can Delete SR6 Forms" },
      { id: "can_view_qds_forms", label: "Can View QDS Forms" },
      { id: "can_create_qds_forms", label: "Can Create QDS Forms" },
      { id: "can_edit_qds_forms", label: "Can Edit QDS Forms" },
      { id: "can_delete_qds_forms", label: "Can Delete QDS Forms" },
    ],
  },
  {
    id: "quality_assurance",
    name: "Quality Assurance",
    icon: ShieldCheck,
    permissions: [
      { id: "can_manage_import_permits", label: "Can Manage Permits" },
      {
        id: "can_view_only_assigned_permits",
        label: "Can View Only assigned Permits",
      },
      { id: "can_view_import_permits", label: "Can View Permits" },
      { id: "can_create_permits", label: "Can Create Permits" },
      { id: "can_edit_import_permits", label: "Can Edit Permits" },
      { id: "can_delete_import_permits", label: "Can Delete Permits" },
      {
        id: "can_manage_planting_returns",
        label: "Can Manage Planting Returns",
      },
      {
        id: "can_view_only_assigned_planting_returns",
        label: "Can View Only assigned Planting Returns",
      },
      {
        id: "can_initialise_inspections",
        label: "Can Initialise Inspections",
      },
      {
        id: "can_create_planting_returns",
        label: "Can Create Planting Returns",
      },
      { id: "can_view_planting_returns", label: "Can View Planting Returns" },
      { id: "can_edit_planting_returns", label: "Can Edit Planting Returns" },
      {
        id: "can_delete_planting_returns",
        label: "Can Delete Planting Returns",
      },

      { id: "can_manage_all_qa_tasks", label: "Can Manage ALL QA Tasks" },
      { id: "qa_can_assign_inspector", label: "Can Assign Inspector" },
      { id: "qa_can_halt", label: "Can Halt" },
      { id: "qa_can_reject", label: "Can Reject" },
      { id: "qa_can_approve", label: "Can Approve" },
      { id: "can_view_field_inspections", label: "Can View Field Inspections" },
      { id: "can_edit_field_inspections", label: "Can Edit Field Inspections" },
      {
        id: "can_delete_field_inspections",
        label: "Can Delete Field Inspections",
      },

      {
        id: "can_manage_seed_lab_inspection",
        label: "Can manage Seed Lab Inspections",
      },
      {
        id: "can_view_only_assigned_seed_lab_inspection",
        label: "Can View Only Assigned Seed Lab Inspections",
      },
      {
        id: "can_view_seed_lab_inspections",
        label: "Can View Seed Lab Inspections",
      },
      {
        id: "can_edit_seed_lab_inspections",
        label: "Can Edit Seed Lab Inspections",
      },
      {
        id: "can_delete_seed_lab_inspections",
        label: "Can Delete Seed Lab Inspections",
      },
      {
        id: "can_perform_seed_lab_inspections",
        label: "Can Perform Seed Lab Inspections",
      },
      {
        id: "can_receive_seed_lab_inspections",
        label: "Can receive Seed Lab Inspections",
      },
      { id: "can_perform_seed_lab_tests", label: "Can perform Seed Lab tests" },

      { id: "can_manage_seed_labels", label: "Can manage Seed Labels" },
      { id: "can_view_seed_labels", label: "Can view Seed Labels" },
      { id: "can_edit_seed_labels", label: "Can edit Seed Labels" },
      { id: "can_approve_seed_labels", label: "Can approve Seed Labels" },
      { id: "can_print_seed_labels", label: "Can print Seed Labels" },
    ],
  },
  {
    id: "seed_stock",
    name: "Seed Stock",
    icon: Package,
    permissions: [
      { id: "can_manage_seed_stock", label: "Can Manage Seed Stock" },
      {
        id: "can_view_only_assigned_seed_stock",
        label: "Can View Only assigned Seed Stock",
      },
      { id: "can_view_seed_stock", label: "Can View Seed Stock" },
      { id: "can_create_seed_stock", label: "Can Create Seed Stock" },
      { id: "can_edit_seed_stock", label: "Can Edit Seed Stock" },
      { id: "can_delete_seed_stock", label: "Can Delete Seed Stock" },
      {
        id: "can_edit_examination_inspections",
        label: "Can Perform Stock Examination Inspections",
      },
    ],
  },
  {
    id: "market_place",
    name: "Market Place",
    icon: ShoppingCart,
    permissions: [
      { id: 'can_view_marketplace', label: 'Can View Marketplace' },
      { id: 'can_order_seeds', label: 'Can Order Seeds' },
      { id: 'can_view_only_own_orders', label: 'Can view only own orders' },

    ]
  },
  {
    id: "system_configuration",
    name: "System Configuration",
    icon: Settings,
    permissions: [
      { id: "can_create_users", label: "Can Create Users" },
      { id: "can_view_settings", label: "Can View Settings" },
      { id: "can_manage_users", label: "Can Manage Users" },
      { id: "can_manage_roles", label: "Can Manage Users" },
      { id: "can_view_roles", label: "Can View Roles" },
      { id: "can_create_roles", label: "Can Create or edit Roles" },
      { id: "can_delete_roles", label: "Can Delete Roles" },
      {
        id: "can_update_role_permissions",
        label: "Can Update Role Permissions",
      },
      { id: "can_manage_crops", label: "Can Manage Crops" },
      { id: "can_view_crops", label: "Can View Crops" },
      { id: "can_edit_crops", label: "Can Edit Crops" },
      { id: "can_delete_crops", label: "Can Delete Crops" },
    ],
  },
];
